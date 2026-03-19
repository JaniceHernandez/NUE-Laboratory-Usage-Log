"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  LogOut, Play, Square, CheckCircle2, 
  Clock, MapPin, Loader2, CalendarClock, 
  ShieldCheck, Sparkles, AlertTriangle,
  History, GraduationCap, Building2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth, useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { SessionService, LabSession } from "@/services/session-service";
import { Room } from "@/services/room-service";
import { UserService, UserProfile } from "@/services/user-service";
import { useToast } from "@/hooks/use-toast";
import { Timestamp, collection, query, where, doc, onSnapshot, limit, DocumentReference, Query } from "firebase/firestore";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";

const COLLEGES = [
  { id: "CICS", name: "Informatics & Computing Studies (CICS)" },
  { id: "CEA", name: "Engineering & Architecture (CEA)" },
  { id: "COC", name: "College of Communication (COC)" },
  { id: "CA", name: "College of Accountancy (CA)" },
];

const PROGRAMS: Record<string, string[]> = {
  CICS: [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information System",
    "Bachelor of Science in Entertainment and Multimedia Computing"
  ],
  CEA: [
    "Bachelor of Science in Architecture",
    "Bachelor of Science in Civil Engineering",
    "Bachelor of Science in Electrical Engineering",
    "Bachelor of Science in Electronics Engineering",
    "Bachelor of Science in Mechanical Engineering"
  ],
  COC: [
    "Bachelor of Arts in Broadcasting",
    "Bachelor of Arts in Communication",
    "Bachelor of Arts in Journalism"
  ],
  CA: [
    "Bachelor of Science in Accounting Information System"
  ]
};

const AUTO_LOGOUT_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 Hours

export default function ProfessorPortal() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userProfileRef = useMemo(() => 
    (db && user) ? (doc(db, "users", user.uid) as DocumentReference<UserProfile>) : null, 
    [db, user]
  );
  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  const [activeSession, setActiveSession] = useState<LabSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [showThresholdWarning, setShowThresholdWarning] = useState(false);
  
  // States for the Thank You Dialog
  const [isThankYouOpen, setIsThankYouOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    professorName: string;
    roomNumber: string;
    college: string;
    program: string;
    durationSeconds: number;
  } | null>(null);
  
  const [room, setRoom] = useState("");
  const [college, setCollege] = useState("");
  const [program, setProgram] = useState("");
  const [section, setSection] = useState("");
  
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualDate, setManualDate] = useState<Date | undefined>(undefined);
  const [manualStartTime, setManualStartTime] = useState("08:00");
  const [manualEndTime, setManualEndTime] = useState("10:00");

  const [onboardingCollege, setOnboardingCollege] = useState("");

  const roomsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "rooms"), where("status", "==", "available")) as Query<Room>;
  }, [db, user]);
  const { data: availableRooms, loading: roomsLoading } = useCollection<Room>(roomsQuery);

  useEffect(() => {
    if (!db || !user?.email) return;

    const sessionsRef = collection(db, "sessions");
    const q = query(
      sessionsRef,
      where("professorEmail", "==", user.email),
      where("status", "==", "active"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docData = snapshot.docs[0];
        setActiveSession({ id: docData.id, ...docData.data() } as LabSession);
      } else {
        setActiveSession(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, user]);

  useEffect(() => {
    let interval: any;
    if (activeSession?.startTime && mounted) {
      interval = setInterval(() => {
        const start = activeSession.startTime.toMillis();
        const now = Date.now();
        const diff = now - start;
        
        if (diff > AUTO_LOGOUT_THRESHOLD_MS) {
          setShowThresholdWarning(true);
        }

        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setElapsedTime(`${h}:${m}:${s}`);
      }, 1000);
    } else {
      setElapsedTime("00:00:00");
      setShowThresholdWarning(false);
    }
    return () => clearInterval(interval);
  }, [activeSession, mounted]);

  const handleOnboarding = async () => {
    if (!db || !user?.uid || !onboardingCollege) return;
    setIsActionLoading(true);
    try {
      await UserService.updateUserCollege(db, user.uid, onboardingCollege);
      toast({ title: "Profile Completed", description: "Your institutional college has been set." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user?.email) return;

    setIsActionLoading(true);

    try {
      if (isManualEntry) {
        if (!manualDate) throw new Error("Please select a session date.");
        
        const start = new Date(manualDate);
        const [sH, sM] = manualStartTime.split(':');
        start.setHours(parseInt(sH), parseInt(sM));
        
        const end = new Date(manualDate);
        const [eH, eM] = manualEndTime.split(':');
        end.setHours(parseInt(eH), parseInt(eM));

        if (end <= start) throw new Error("End time must be after start time.");

        await SessionService.logManualSession(db, {
          professorEmail: user.email,
          roomNumber: room,
          college,
          program,
          section,
          startTime: Timestamp.fromDate(start),
          endTime: Timestamp.fromDate(end)
        });
        
        // Show thank you for manual entry too
        setSummaryData({
          professorName: profile?.name || user.displayName || "Authorized User",
          roomNumber: room,
          college,
          program,
          durationSeconds: Math.floor((end.getTime() - start.getTime()) / 1000)
        });
        setIsThankYouOpen(true);
      } else {
        await SessionService.startSession(db, {
          professorEmail: user.email,
          roomNumber: room,
          college,
          program,
          section
        });
        toast({ title: "Check-in Successful", description: `Active session started in Room ${room}.` });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "System Alert", description: error.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!db || !activeSession?.id || !activeSession.startTime) return;
    setIsActionLoading(true);

    try {
      const roomName = activeSession.roomNumber;
      const startMs = activeSession.startTime.toMillis();
      const endMs = Date.now();
      const durationSeconds = Math.floor((endMs - startMs) / 1000);

      // Capture summary before clearing active state
      setSummaryData({
        professorName: profile?.name || user?.displayName || "Authorized User",
        roomNumber: roomName,
        college: activeSession.college,
        program: activeSession.program,
        durationSeconds
      });

      await SessionService.endSession(db, activeSession.id, activeSession.startTime, roomName);
      setIsThankYouOpen(true);
      setElapsedTime("00:00:00");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Operation Failed", description: error.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (activeSession) {
      toast({ variant: "destructive", title: "Active Session", description: "Please check-out before leaving." });
      return;
    }
    if (auth) {
      await signOut(auth);
      router.push("/");
    }
  };

  const isActuallyLoading = authLoading || roomsLoading || profileLoading || !mounted;

  if (isActuallyLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Syncing institutional data...</p>
      </div>
    );
  }

  const needsOnboarding = profile && !profile.college;

  return (
    <AuthGuard allowedRoles={["professor", "admin"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-primary text-white py-6 px-10 flex justify-between items-center shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-white/20 relative p-1.5 shadow-sm">
              <Image 
                src="https://lxgw2qbdgc9uqivt.public.blob.vercel-storage.com/cics-logs/New_Era_University.svg" 
                alt="NEU Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black uppercase tracking-tight leading-none">NEW ERA UNIVERSITY</h1>
              <p className="text-[11px] font-bold text-white/80 uppercase tracking-[0.3em] mt-1.5">LABORATORY USAGE LOG</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-base font-bold">{profile?.name || user?.displayName}</p>
              <p className="text-[11px] text-white/70 uppercase font-bold tracking-widest">{profile?.college || "Professor Portal"}</p>
            </div>
            <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-2xl h-11 w-11" onClick={handleLogout}>
              <LogOut size={24} />
            </Button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto p-8 mt-4 pb-24">
          {needsOnboarding ? (
            <Card className="shadow-2xl border-none rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500 max-w-2xl mx-auto">
              <CardHeader className="text-center pt-12 pb-6">
                <div className="mx-auto w-16 h-16 bg-blue-50 text-primary rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
                  <ShieldCheck size={32} />
                </div>
                <CardTitle className="text-2xl font-black">Institutional Onboarding</CardTitle>
                <CardDescription className="text-sm font-medium mt-2">Please select your college affiliation to personalize your portal experience.</CardDescription>
              </CardHeader>
              <CardContent className="px-12 py-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional College</Label>
                  <Select onValueChange={setOnboardingCollege}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-sm font-bold">
                      <SelectValue placeholder="Select your primary college" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {COLLEGES.map(c => <SelectItem key={c.id} value={c.id} className="rounded-xl">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="px-12 pb-12">
                <Button 
                  className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-bold shadow-xl shadow-primary/20 text-base"
                  disabled={!onboardingCollege || isActionLoading}
                  onClick={handleOnboarding}
                >
                  {isActionLoading ? <Loader2 className="animate-spin" /> : "Complete My Profile"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {showThresholdWarning && (
                <Alert className="bg-orange-50 text-orange-700 border-orange-200 shadow-xl animate-pulse rounded-[2rem] p-6 border-2">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                    <div className="flex-1">
                      <AlertTitle className="font-black text-sm uppercase tracking-widest">Extended Usage Warning</AlertTitle>
                      <AlertDescription className="text-xs font-bold mt-1">
                        Your current laboratory session has exceeded 4 hours. Please ensure this is expected behavior or perform a check-out.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              {!activeSession ? (
                <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.08)] border-none rounded-[3.5rem] overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b border-slate-50 p-10">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-3 text-3xl font-black text-slate-800 tracking-tight">
                          {isManualEntry ? <CalendarClock size={32} className="text-primary" /> : <Play size={32} className="text-primary" />}
                          {isManualEntry ? "Audit Trail Entry" : "Faculty Check-in"}
                        </CardTitle>
                        <CardDescription className="text-[11px] text-slate-400 uppercase font-black tracking-[0.3em]">
                          Facility utilization management portal
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                        <Label htmlFor="manual-mode" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Manual Entry</Label>
                        <Switch id="manual-mode" checked={isManualEntry} onCheckedChange={setIsManualEntry} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <form id="session-form" onSubmit={handleSubmitSession} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="room" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                            <Building2 size={14} /> Laboratory Facility
                          </Label>
                          <Select onValueChange={setRoom} required>
                            <SelectTrigger id="room" className="h-14 rounded-2xl bg-slate-50 border-none text-sm font-bold shadow-inner">
                              <SelectValue placeholder="Choose target room" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              {availableRooms.map((r) => (
                                <SelectItem 
                                  key={r.id} 
                                  value={r.number} 
                                  disabled={r.currentlyOccupied}
                                  className={cn("rounded-xl", r.currentlyOccupied && "opacity-50")}
                                >
                                  {r.number} — {r.location} {r.currentlyOccupied ? "(Occupied)" : ""}
                                </SelectItem>
                              ))}
                              {availableRooms.length === 0 && <SelectItem value="none" disabled>No rooms currently available</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="college" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                            <GraduationCap size={14} /> Academic College
                          </Label>
                          <Select onValueChange={(val) => { setCollege(val); setProgram(""); }} required>
                            <SelectTrigger id="college" className="h-14 rounded-2xl bg-slate-50 border-none text-sm font-bold shadow-inner">
                              <SelectValue placeholder="Select target college" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              {COLLEGES.map(c => <SelectItem key={c.id} value={c.id} className="rounded-xl">{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="program" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Degree Program / Course</Label>
                          <Select onValueChange={setProgram} disabled={!college} required>
                            <SelectTrigger id="program" className="h-14 rounded-2xl bg-slate-50 border-none text-sm font-bold shadow-inner disabled:opacity-40">
                              <SelectValue placeholder={college ? "Select specific program" : "Awaiting college selection..."} />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              {college && PROGRAMS[college]?.map(p => (
                                <SelectItem key={p} value={p} className="rounded-xl">{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="section" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Class Section Code</Label>
                          <Input 
                            id="section" 
                            placeholder="e.g., CICS-401B" 
                            className="h-14 rounded-2xl bg-slate-50 border-none text-sm font-bold shadow-inner px-6" 
                            onChange={(e) => setSection(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>

                      {isManualEntry && (
                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-6 animate-in slide-in-from-top-6 duration-500 shadow-inner">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Session Audit Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full h-12 justify-start rounded-2xl bg-white border-none shadow-sm text-sm font-bold", !manualDate && "text-muted-foreground")}>
                                  <Clock className="mr-3 h-5 w-5 text-primary" />
                                  {manualDate ? format(manualDate, "PPP") : <span>Select historical date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="start">
                                <Calendar mode="single" selected={manualDate} onSelect={setManualDate} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Time</Label>
                              <Input type="time" className="h-12 rounded-2xl bg-white border-none shadow-sm text-sm font-bold px-6" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">End Time</Label>
                              <Input type="time" className="h-12 rounded-2xl bg-white border-none shadow-sm text-sm font-bold px-6" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  </CardContent>
                  <CardFooter className="p-10 pt-0">
                    <Button 
                      form="session-form" 
                      className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[2rem] text-xl font-black shadow-2xl shadow-primary/20 transition-all active:scale-[0.97] disabled:opacity-50"
                      disabled={isActionLoading || (availableRooms && availableRooms.length === 0)}
                    >
                      {isActionLoading ? <Loader2 className="animate-spin mr-3" size={24} /> : (isManualEntry ? <CalendarClock className="mr-4" size={28} /> : <Play className="mr-4" size={28} />)}
                      {isManualEntry ? "Submit Audit Log" : "Commence Session"}
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="shadow-[0_30px_60px_rgba(0,0,0,0.12)] border-none rounded-[4rem] overflow-hidden bg-white animate-in zoom-in-95 duration-700">
                  <CardHeader className="text-center pt-16 pb-4">
                    <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mb-8 relative">
                      <Clock size={48} className="animate-pulse" />
                      <div className="absolute inset-0 bg-primary/5 rounded-[2.5rem] animate-ping opacity-20" />
                    </div>
                    <CardTitle className="text-4xl font-black text-slate-800 tracking-tighter">Session in Progress</CardTitle>
                    <CardDescription className="text-[12px] text-slate-400 font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2 mt-4">
                      <MapPin size={16} className="text-primary" /> Facility {activeSession.roomNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-10 px-12 pb-12">
                    <div className="bg-slate-50 rounded-[3rem] p-12 border border-slate-100 text-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6"><Sparkles className="text-primary/15" size={40} /></div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-[0.5em] font-black mb-4">Total Elapsed Time</p>
                      <p className="text-7xl font-mono font-black text-primary tabular-nums tracking-tighter">{elapsedTime}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col p-6 bg-white rounded-[2rem] border border-slate-50 shadow-sm">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                          <GraduationCap size={14} /> College Affiliation
                        </span>
                        <p className="text-lg font-black text-slate-700">{activeSession.college}</p>
                      </div>
                      <div className="flex flex-col p-6 bg-white rounded-[2rem] border border-slate-50 shadow-sm">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2 flex items-center gap-2">
                          <History size={14} /> Program / Course
                        </span>
                        <p className="text-lg font-black text-slate-700 truncate">{activeSession.program}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-12 pb-16">
                    <Button 
                      variant="destructive" 
                      className="w-full h-24 rounded-[2.5rem] text-2xl font-black shadow-[0_20px_50px_rgba(239,68,68,0.2)] transition-all active:scale-[0.95]" 
                      onClick={handleEndSession}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? <Loader2 className="animate-spin mr-3" size={28} /> : <Square className="mr-4 fill-white" size={32} />}
                      Check-out of Facility
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </main>

        <Dialog open={isThankYouOpen} onOpenChange={setIsThankYouOpen}>
          <DialogContent className="sm:max-w-2xl rounded-[3rem] p-12 border-none shadow-[0_40px_100px_rgba(0,0,0,0.15)] overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Image src="https://lxgw2qbdgc9uqivt.public.blob.vercel-storage.com/cics-logs/New_Era_University.svg" alt="NEU" width={100} height={100} /></div>
            <DialogHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-green-50 text-green-600 rounded-[1.75rem] flex items-center justify-center mb-8 shadow-sm">
                <CheckCircle2 size={40} />
              </div>
              <DialogTitle className="text-4xl font-black text-slate-900 tracking-tighter">Check-out Complete</DialogTitle>
              <DialogDescription className="text-lg font-bold text-slate-500 mt-2">
                Thank you, Professor <span className="text-primary">{summaryData?.professorName}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-10 space-y-6">
              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Duration</p>
                    <p className="text-2xl font-black text-slate-800">{summaryData?.durationSeconds} <span className="text-base font-bold text-slate-400">Seconds</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Facility</p>
                  <p className="text-2xl font-black text-primary">{summaryData?.roomNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic College</p>
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 shadow-sm">{summaryData?.college}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Degree Program</p>
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 shadow-sm truncate">{summaryData?.program}</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => setIsThankYouOpen(false)} 
                className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] text-lg font-black transition-all shadow-xl shadow-slate-200"
              >
                Close & Return
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
