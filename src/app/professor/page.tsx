"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LogOut, Play, Square, CheckCircle2, Clock, MapPin, Loader2, CalendarClock, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
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
  const [lastEndedRoom, setLastEndedRoom] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  
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
    setShowThankYou(false);

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
        toast({ title: "Logged Successfully", description: `Laboratory usage record saved.` });
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
    const roomName = activeSession.roomNumber;

    try {
      await SessionService.endSession(db, activeSession.id, activeSession.startTime, roomName);
      setLastEndedRoom(roomName);
      setShowThankYou(true);
      setElapsedTime("00:00:00");
      toast({ title: "Check-out Complete", description: "Your laboratory usage has been logged." });
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
        <p className="text-sm font-medium text-slate-400">Syncing institutional data...</p>
      </div>
    );
  }

  const needsOnboarding = profile && !profile.college;

  return (
    <AuthGuard allowedRoles={["professor", "admin"]}>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-primary text-white py-4 px-6 flex justify-between items-center shadow-lg sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-white/20 relative p-1">
              <Image 
                src="https://lxgw2qbdgc9uqivt.public.blob.vercel-storage.com/cics-logs/New_Era_University.svg" 
                alt="NEU Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black uppercase tracking-tight leading-none">NEW ERA UNIVERSITY</h1>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">LABORATORY USAGE LOG</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{profile?.name || user?.displayName}</p>
              <p className="text-[10px] text-white/70 uppercase font-bold tracking-tight">{profile?.college || "Professor Portal"}</p>
            </div>
            <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl" onClick={handleLogout}>
              <LogOut size={20} />
            </Button>
          </div>
        </header>

        <main className="max-w-xl mx-auto p-4 mt-6 pb-20">
          {needsOnboarding ? (
            <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden bg-white">
              <CardHeader className="text-center pt-8">
                <div className="mx-auto w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck size={28} />
                </div>
                <CardTitle className="text-xl font-bold">First-Time Setup</CardTitle>
                <CardDescription className="text-sm">Select your primary college to complete your institutional profile.</CardDescription>
              </CardHeader>
              <CardContent className="px-8 py-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Institutional College</Label>
                  <Select onValueChange={setOnboardingCollege}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none shadow-inner text-sm">
                      <SelectValue placeholder="Choose your college" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLEGES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="px-8 pb-8">
                <Button 
                  className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20"
                  disabled={!onboardingCollege || isActionLoading}
                  onClick={handleOnboarding}
                >
                  {isActionLoading ? <Loader2 className="animate-spin" /> : "Finish Setup"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              {showThresholdWarning && (
                <Alert className="mb-4 bg-orange-50 text-orange-700 border-orange-200 shadow-sm animate-bounce rounded-xl p-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="font-bold text-xs">Extended Session Warning</AlertTitle>
                  <AlertDescription className="text-[10px]">
                    Your session has exceeded 4 hours. Please check-out if your activities are complete.
                  </AlertDescription>
                </Alert>
              )}

              {showThankYou && lastEndedRoom && (
                <Alert className="mb-4 bg-green-50 text-green-700 border-green-200 shadow-sm rounded-xl p-3">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="font-bold text-xs">Check-out Successful</AlertTitle>
                  <AlertDescription className="text-[10px]">
                    Thank you for using Room <span className="font-bold">{lastEndedRoom}</span>.
                  </AlertDescription>
                </Alert>
              )}

              {!activeSession ? (
                <Card className="shadow-lg border-none rounded-[2rem] overflow-hidden bg-white">
                  <CardHeader className="bg-white border-b border-slate-50 pb-4 px-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                          {isManualEntry ? <CalendarClock size={20} className="text-primary" /> : <Play size={20} className="text-primary" />}
                          {isManualEntry ? "Log Manual Usage" : "Check-in"}
                        </CardTitle>
                        <CardDescription className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Facility availability updated in real-time</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Label htmlFor="manual-mode" className="text-[9px] font-bold uppercase text-slate-400">Manual</Label>
                        <Switch id="manual-mode" checked={isManualEntry} onCheckedChange={setIsManualEntry} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 px-6">
                    <form id="session-form" onSubmit={handleSubmitSession} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="room" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Laboratory Facility</Label>
                          <Select onValueChange={setRoom} required>
                            <SelectTrigger id="room" className="h-11 rounded-xl bg-slate-50 border-none text-xs">
                              <SelectValue placeholder="Select facility" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRooms.map((r) => (
                                <SelectItem 
                                  key={r.id} 
                                  value={r.number} 
                                  disabled={r.currentlyOccupied}
                                  className={r.currentlyOccupied ? "opacity-50 line-through" : ""}
                                >
                                  {r.number} - {r.location} {r.currentlyOccupied ? "(In Use)" : ""}
                                </SelectItem>
                              ))}
                              {availableRooms.length === 0 && <SelectItem value="none" disabled>No active facilities available</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="college" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Target College</Label>
                          <Select onValueChange={(val) => { setCollege(val); setProgram(""); }} required>
                            <SelectTrigger id="college" className="h-11 rounded-xl bg-slate-50 border-none text-xs">
                              <SelectValue placeholder="Select college" />
                            </SelectTrigger>
                            <SelectContent>
                              {COLLEGES.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="program" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Degree Program</Label>
                          <Select onValueChange={setProgram} disabled={!college} required>
                            <SelectTrigger id="program" className="h-11 rounded-xl bg-slate-50 border-none text-xs">
                              <SelectValue placeholder={college ? "Select program" : "Select college first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {college && PROGRAMS[college]?.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="section" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Section</Label>
                          <Input id="section" placeholder="e.g., 4B" className="h-11 rounded-xl bg-slate-50 border-none text-xs" onChange={(e) => setSection(e.target.value)} required />
                        </div>
                      </div>

                      {isManualEntry && (
                        <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-4 animate-in slide-in-from-top-4 duration-500">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase text-slate-400">Session Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full h-10 justify-start rounded-xl bg-white text-xs", !manualDate && "text-muted-foreground")}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  {manualDate ? format(manualDate, "PPP") : <span>Pick session date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                                <Calendar mode="single" selected={manualDate} onSelect={setManualDate} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-bold uppercase text-slate-400">Start Time</Label>
                              <Input type="time" className="h-10 rounded-xl bg-white text-xs" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-bold uppercase text-slate-400">End Time</Label>
                              <Input type="time" className="h-10 rounded-xl bg-white text-xs" value={manualEndTime} onChange={(e) => setManualEndTime(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  </CardContent>
                  <CardFooter className="px-6 pb-8">
                    <Button 
                      form="session-form" 
                      className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                      disabled={isActionLoading || (availableRooms && availableRooms.length === 0)}
                    >
                      {isActionLoading ? <Loader2 className="animate-spin mr-2" /> : (isManualEntry ? <CalendarClock className="mr-2" size={18} /> : <Play className="mr-2" size={18} />)}
                      {isManualEntry ? "Save Log" : "Check-in Facility"}
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500">
                  <CardHeader className="text-center pb-2 pt-8">
                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 relative">
                      <Clock size={40} className="animate-pulse" />
                      <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-20" />
                    </div>
                    <CardTitle className="text-2xl font-extrabold text-slate-800">Session Active</CardTitle>
                    <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                      <MapPin size={12} /> Facility {activeSession.roomNumber}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 px-8 pb-8">
                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 text-center shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3"><Sparkles className="text-primary/20" size={24} /></div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-bold mb-2">Duration</p>
                      <p className="text-5xl font-mono font-bold text-primary tabular-nums tracking-tighter">{elapsedTime}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">College</span>
                        <p className="text-xs font-extrabold text-slate-700">{activeSession.college}</p>
                      </div>
                      <div className="flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Program</span>
                        <p className="text-xs font-extrabold text-slate-700 truncate">{activeSession.program}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-8 pb-10">
                    <Button 
                      variant="destructive" 
                      className="w-full h-16 rounded-[1.5rem] text-xl font-black shadow-2xl shadow-red-100 transition-all active:scale-[0.95]" 
                      onClick={handleEndSession}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? <Loader2 className="animate-spin mr-2" /> : <Square className="mr-3" size={24} />}
                      Check-out
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}