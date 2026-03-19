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
  ShieldCheck, AlertTriangle,
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
  { id: "College of Informatics and Computing Studies", name: "College of Informatics and Computing Studies" },
  { id: "College of Engineering and Architecture", name: "College of Engineering and Architecture" },
  { id: "College of Communication", name: "College of Communication" },
  { id: "College of Accountancy", name: "College of Accountancy" },
];

const PROGRAMS: Record<string, string[]> = {
  "College of Informatics and Computing Studies": [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information System",
    "Bachelor of Science in Entertainment and Multimedia Computing"
  ],
  "College of Engineering and Architecture": [
    "Bachelor of Science in Architecture",
    "Bachelor of Science in Civil Engineering",
    "Bachelor of Science in Electrical Engineering",
    "Bachelor of Science in Electronics Engineering",
    "Bachelor of Science in Mechanical Engineering"
  ],
  "College of Communication": [
    "Bachelor of Arts in Broadcasting",
    "Bachelor of Arts in Communication",
    "Bachelor of Arts in Journalism"
  ],
  "College of Accountancy": [
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
    }, (error) => {
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
      toast({ title: "Profile Completed", description: "Institutional profile updated." });
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
        if (!manualDate) throw new Error("Select a date.");
        
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
        toast({ title: "Check-in Successful", description: `Session active in Room ${room}.` });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Check-in Error", description: error.message });
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
      toast({ variant: "destructive", title: "Error Ending Session", description: error.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (activeSession) {
      toast({ variant: "destructive", title: "Session Active", description: "Please check-out before logging out." });
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
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preparing portal...</p>
      </div>
    );
  }

  const needsOnboarding = profile && !profile.college;

  return (
    <AuthGuard allowedRoles={["professor", "admin"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-100 py-4 px-10 flex justify-between items-center sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 relative p-1">
              <Image 
                src="https://lxgw2qbdgc9uqivt.public.blob.vercel-storage.com/cics-logs/New_Era_University.svg" 
                alt="NEU Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">NEW ERA UNIVERSITY</h1>
              <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Laboratory Usage Log</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{profile?.name || user?.displayName}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{profile?.college || "Professor"}</p>
            </div>
            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-xl h-10 w-10 text-slate-400" onClick={handleLogout}>
              <LogOut size={20} />
            </Button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto p-8 pt-12 pb-24">
          {needsOnboarding ? (
            <Card className="shadow-xl border-none rounded-[2.5rem] overflow-hidden bg-white max-w-xl mx-auto">
              <CardHeader className="text-center pt-10 pb-4">
                <CardTitle className="text-2xl font-black">Profile Setup</CardTitle>
                <CardDescription className="text-sm font-medium mt-1">Select your college affiliation to continue.</CardDescription>
              </CardHeader>
              <CardContent className="px-10 py-4 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">College</Label>
                  <Select onValueChange={setOnboardingCollege}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-sm text-sm font-bold">
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {COLLEGES.map(c => <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="px-10 pb-10">
                <Button 
                  className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20"
                  disabled={!onboardingCollege || isActionLoading}
                  onClick={handleOnboarding}
                >
                  {isActionLoading ? <Loader2 className="animate-spin" /> : "Complete Profile"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {showThresholdWarning && (
                <Alert className="bg-orange-50 text-orange-700 border-orange-200 shadow-sm rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <AlertTitle className="font-bold text-xs uppercase tracking-widest">Extended Session</AlertTitle>
                      <AlertDescription className="text-[10px] mt-0.5">
                        Session has exceeded 4 hours. Please check-out if finished.
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              )}

              {!activeSession ? (
                <Card className="shadow-2xl border-none rounded-[3rem] overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b border-slate-50 p-10">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">
                          Check-in Portal
                        </CardTitle>
                        <CardDescription className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">
                          Laboratory Access Management
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                        <Label htmlFor="manual-mode" className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-2">Manual Entry</Label>
                        <Switch id="manual-mode" checked={isManualEntry} onCheckedChange={setIsManualEntry} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <form id="session-form" onSubmit={handleSubmitSession} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="room" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Room Number</Label>
                          <Select onValueChange={setRoom} required>
                            <SelectTrigger id="room" className="h-14 rounded-2xl bg-slate-50 border-none text-sm font-bold shadow-sm">
                              <SelectValue placeholder="Select Room" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {availableRooms.map((r) => (
                                <SelectItem key={r.id} value={r.number} disabled={r.currentlyOccupied} className="rounded-lg">
                                  {r.number} - {r.location} {r.currentlyOccupied ? "(Occupied)" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="college" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">College</Label>
                          <Select onValueChange={(val) => { setCollege(val); setProgram(""); }} required>
                            <SelectTrigger id="college" className="h-14 rounded-2xl bg-slate-50 border-none text-sm font-bold shadow-sm">
                              <SelectValue placeholder="Select College" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {COLLEGES.map(c => <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label htmlFor="program" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Program</Label>
                          <Select onValueChange={setProgram} disabled={!college} required>
                            <SelectTrigger id="program" className="h-14 rounded-2xl bg-slate-50 border-none text-sm font-bold shadow-sm">
                              <SelectValue placeholder={college ? "Select Program" : "Select College First"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {college && PROGRAMS[college]?.map(p => (
                                <SelectItem key={p} value={p} className="rounded-lg">{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="section" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Section</Label>
                          <Input 
                            id="section" 
                            placeholder="e.g., CICS-401B" 
                            className="h-14 rounded-2xl bg-slate-50 border-none text-sm font-bold shadow-sm px-6" 
                            onChange={(e) => setSection(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>

                      {isManualEntry && (
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6 animate-in slide-in-from-top-4 duration-500">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full h-12 justify-start rounded-xl bg-white border-none shadow-sm text-sm font-bold", !manualDate && "text-muted-foreground")}>
                                  <Clock className="mr-3 h-4 w-4 text-primary" />
                                  {manualDate ? format(manualDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-xl" align="start">
                                <Calendar mode="single" selected={manualDate} onSelect={setManualDate} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Start Time</Label>
                              <Input type="time" className="h-12 rounded-xl bg-white border-none shadow-sm text-sm font-bold px-6" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">End Time</Label>
                              <Input type="time" className="h-12 rounded-xl bg-white border-none shadow-sm text-sm font-bold px-6" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  </CardContent>
                  <CardFooter className="p-10 pt-0">
                    <Button 
                      form="session-form" 
                      className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                      disabled={isActionLoading || (availableRooms && availableRooms.length === 0)}
                    >
                      {isActionLoading ? <Loader2 className="animate-spin mr-3" size={20} /> : (isManualEntry ? <CalendarClock className="mr-3" size={24} /> : <Play className="mr-3" size={24} />)}
                      {isManualEntry ? "Save Log Entry" : "Start Session"}
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500">
                  <CardHeader className="text-center pt-16 pb-4">
                    <div className="mx-auto w-20 h-20 bg-primary/5 text-primary rounded-[2rem] flex items-center justify-center mb-6">
                      <Clock size={40} className="animate-pulse" />
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">Session Active</CardTitle>
                    <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 mt-2">
                      <MapPin size={14} className="text-primary" /> Room {activeSession.roomNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 px-12 pb-12">
                    <div className="bg-slate-50/50 rounded-[2.5rem] p-10 border border-slate-50 text-center shadow-inner">
                      <p className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black mb-2">Duration</p>
                      <p className="text-6xl font-mono font-black text-slate-900 tabular-nums tracking-tighter">{elapsedTime}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 block">College</span>
                        <p className="text-sm font-bold text-slate-700">{activeSession.college}</p>
                      </div>
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 block">Program</span>
                        <p className="text-sm font-bold text-slate-700 truncate">{activeSession.program}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-12 pb-16">
                    <Button 
                      variant="destructive" 
                      className="w-full h-16 rounded-2xl text-xl font-black shadow-lg shadow-destructive/20 transition-all active:scale-[0.98]" 
                      onClick={handleEndSession}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? <Loader2 className="animate-spin mr-3" size={24} /> : <Square className="mr-3" size={24} />}
                      Check-out Room
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </main>

        <Dialog open={isThankYouOpen} onOpenChange={setIsThankYouOpen}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl overflow-hidden">
            <DialogHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <DialogTitle className="text-3xl text-center font-black text-slate-900 tracking-tight">Session Complete</DialogTitle>
              <DialogDescription className="text-base text-center font-bold text-slate-500 mt-1">
                Thank you for using Room {summaryData?.roomNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="py-8 space-y-4 text-center">
              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 shadow-inner">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">FACULTY MEMBER</p>
                    <p className="text-xl font-black text-slate-800">Prof. {summaryData?.professorName}</p>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-200/50 space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">USAGE DURATION</p>
                      <p className="text-xl font-black text-primary">
                        {summaryData ? Math.ceil(summaryData.durationSeconds / 60) : 0} 
                        <span className="text-sm font-bold text-slate-400 ml-1">Minutes</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">COLLEGE</p>
                      <p className="text-xl font-black text-slate-700 leading-tight">{summaryData?.college}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ACADEMIC PROGRAM</p>
                      <p className="text-xl font-black text-slate-700 leading-tight">{summaryData?.program}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => setIsThankYouOpen(false)} 
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-bold transition-all shadow-lg shadow-slate-200"
              >
                Close Summary
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
}
