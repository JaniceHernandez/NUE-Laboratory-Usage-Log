"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LogOut, Play, Square, CheckCircle2, Clock, MapPin, GraduationCap, Loader2, CalendarClock, Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import { SessionService, LabSession } from "@/services/session-service";
import { useToast } from "@/hooks/use-toast";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function ProfessorPortal() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [activeSession, setActiveSession] = useState<LabSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [lastEndedRoom, setLastEndedRoom] = useState<string | null>(null);
  
  // Form State
  const [room, setRoom] = useState("");
  const [college, setCollege] = useState("");
  const [program, setProgram] = useState("");
  const [section, setSection] = useState("");
  
  // Manual Entry State
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualStartDate, setManualStartDate] = useState<Date | undefined>(new Date());
  const [manualStartTime, setManualStartTime] = useState("08:00");
  const [manualEndDate, setManualEndDate] = useState<Date | undefined>(new Date());
  const [manualEndTime, setManualEndTime] = useState("10:00");

  // Load active session on mount
  useEffect(() => {
    if (user?.email && db) {
      SessionService.getActiveSession(db, user.email)
        .then(setActiveSession)
        .finally(() => setIsLoading(false));
    }
  }, [user, db]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession?.startTime) {
      interval = setInterval(() => {
        const start = activeSession.startTime.toMillis();
        const now = Date.now();
        const diff = now - start;
        
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setElapsedTime(`${h}:${m}:${s}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user?.email) return;

    setIsActionLoading(true);
    setLastEndedRoom(null);

    try {
      if (isManualEntry) {
        if (!manualStartDate || !manualEndDate) throw new Error("Please select both start and end dates.");
        
        const start = new Date(manualStartDate);
        const [sH, sM] = manualStartTime.split(':');
        start.setHours(parseInt(sH), parseInt(sM));

        const end = new Date(manualEndDate);
        const [eH, eM] = manualEndTime.split(':');
        end.setHours(parseInt(eH), parseInt(eM));

        await SessionService.logManualSession(db, {
          professorEmail: user.email,
          roomNumber: room,
          college,
          program,
          section,
          startTime: Timestamp.fromDate(start),
          endTime: Timestamp.fromDate(end)
        });

        toast({
          title: "Session Logged",
          description: `Manual entry for ${room} has been saved.`,
        });
        
        setLastEndedRoom(room);
      } else {
        await SessionService.startSession(db, {
          professorEmail: user.email,
          roomNumber: room,
          college,
          program,
          section
        });
        
        const newActive = await SessionService.getActiveSession(db, user.email);
        setActiveSession(newActive);
        
        toast({
          title: "Session Started",
          description: `Now tracking usage for ${room}.`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not process session.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!db || !activeSession?.id || !activeSession.startTime) return;

    setIsActionLoading(true);
    const roomName = activeSession.roomNumber;

    try {
      await SessionService.endSession(db, activeSession.id, activeSession.startTime);
      setActiveSession(null);
      setLastEndedRoom(roomName);
      setElapsedTime("00:00:00");
      
      toast({
        title: "Session Ended",
        description: "Your lab usage has been recorded successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not end session.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (activeSession) {
      toast({
        variant: "destructive",
        title: "Active Session",
        description: "Please end your current laboratory session before logging out.",
      });
      return;
    }
    if (auth) {
      await signOut(auth);
      router.push("/");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-sm font-medium text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={["professor", "admin"]}>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-primary text-white py-4 px-6 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <GraduationCap size={24} className="text-secondary" />
            <h1 className="text-xl font-bold font-headline">NEU LabTrack</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.displayName}</p>
              <p className="text-[10px] text-white/70 uppercase">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={handleLogout}>
              <LogOut size={20} />
            </Button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-6 mt-8 pb-20">
          {lastEndedRoom && (
            <Alert className="mb-6 bg-green-50 text-green-700 border-green-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="font-bold">Session Logged Successfully</AlertTitle>
              <AlertDescription>
                Thank you for using Room <span className="font-bold">{lastEndedRoom}</span>.
              </AlertDescription>
            </Alert>
          )}

          {!activeSession ? (
            <Card className="shadow-md border-none rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-white border-b border-slate-50 pb-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                      {isManualEntry ? <CalendarClock size={20} className="text-primary" /> : <Play size={20} className="text-primary" />}
                      {isManualEntry ? "Log Past Session" : "Start New Lab Session"}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {isManualEntry ? "Enter the details for a session you've already completed." : "Fill in the details below to begin tracking your usage."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Label htmlFor="manual-mode" className="text-[10px] font-bold uppercase text-slate-400">Manual Entry</Label>
                    <Switch id="manual-mode" checked={isManualEntry} onCheckedChange={setIsManualEntry} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <form id="session-form" onSubmit={handleSubmitSession} className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="room" className="text-xs font-bold uppercase tracking-wider text-slate-500">Room Number</Label>
                      <Select onValueChange={setRoom} required>
                        <SelectTrigger id="room" className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COM LAB 1">COM LAB 1</SelectItem>
                          <SelectItem value="COM LAB 2">COM LAB 2</SelectItem>
                          <SelectItem value="PHY LAB">PHY LAB</SelectItem>
                          <SelectItem value="CHEM LAB">CHEM LAB</SelectItem>
                          <SelectItem value="LAB 402">LAB 402</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="college" className="text-xs font-bold uppercase tracking-wider text-slate-500">College</Label>
                      <Select onValueChange={setCollege} required>
                        <SelectTrigger id="college" className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                          <SelectValue placeholder="Select college" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CICS">CICS</SelectItem>
                          <SelectItem value="CEA">CEA</SelectItem>
                          <SelectItem value="CAS">CAS</SelectItem>
                          <SelectItem value="CBA">CBA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="program" className="text-xs font-bold uppercase tracking-wider text-slate-500">Program</Label>
                      <Input 
                        id="program" 
                        placeholder="e.g., BSCS" 
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50" 
                        onChange={(e) => setProgram(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section" className="text-xs font-bold uppercase tracking-wider text-slate-500">Section</Label>
                      <Input 
                        id="section" 
                        placeholder="e.g., 3B" 
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50" 
                        onChange={(e) => setSection(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  {isManualEntry && (
                    <div className="p-6 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-6 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarClock size={16} className="text-primary" />
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Time Specification</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Start Date & Time</Label>
                          <div className="flex flex-col gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full h-12 justify-start text-left font-normal rounded-xl bg-white",
                                    !manualStartDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {manualStartDate ? format(manualStartDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="start">
                                <Calendar
                                  mode="single"
                                  selected={manualStartDate}
                                  onSelect={setManualStartDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Input 
                              type="time" 
                              className="h-12 rounded-xl bg-white" 
                              value={manualStartTime} 
                              onChange={(e) => setManualStartTime(e.target.value)} 
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">End Date & Time</Label>
                          <div className="flex flex-col gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full h-12 justify-start text-left font-normal rounded-xl bg-white",
                                    !manualEndDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {manualEndDate ? format(manualEndDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="start">
                                <Calendar
                                  mode="single"
                                  selected={manualEndDate}
                                  onSelect={setManualEndDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Input 
                              type="time" 
                              className="h-12 rounded-xl bg-white" 
                              value={manualEndTime} 
                              onChange={(e) => setManualEndTime(e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isManualEntry && (
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
                      <Clock size={18} className="text-primary mt-0.5" />
                      <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        Your session timer will start immediately after clicking the button below.
                      </p>
                    </div>
                  )}
                </form>
              </CardContent>
              <CardFooter className="p-6 pt-2">
                <Button 
                  form="session-form" 
                  className="w-full h-14 bg-primary hover:bg-primary/90 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? <Loader2 className="animate-spin mr-2" /> : (
                    isManualEntry ? <CalendarClock className="mr-2" size={20} /> : <Play className="mr-2" size={20} />
                  )}
                  {isManualEntry ? "Log Completed Session" : "Start Session"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="shadow-2xl border-none rounded-3xl overflow-hidden bg-white animate-in zoom-in-95 duration-500">
              <CardHeader className="text-center pb-2 pt-10">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                  <Clock size={40} className="animate-pulse" />
                </div>
                <CardTitle className="text-3xl font-extrabold text-slate-800">Active Session</CardTitle>
                <CardDescription className="text-slate-400 font-medium">
                  Currently using <span className="text-primary font-bold">{activeSession.roomNumber}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 px-8 pb-10">
                <div className="bg-slate-50 rounded-[32px] p-10 border border-slate-100 text-center shadow-inner">
                  <p className="text-xs text-slate-400 uppercase tracking-[0.2em] font-bold mb-4">Elapsed Time</p>
                  <p className="text-6xl font-mono font-bold text-primary tabular-nums tracking-tighter">{elapsedTime}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Location</p>
                      <p className="text-sm font-bold text-slate-700">{activeSession.roomNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Program</p>
                      <p className="text-sm font-bold text-slate-700">{activeSession.program}-{activeSession.section}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-8 pb-10">
                <Button 
                  variant="destructive" 
                  className="w-full h-16 rounded-2xl text-xl font-extrabold shadow-xl shadow-red-100 hover:scale-[1.01] transition-all active:scale-95" 
                  onClick={handleEndSession}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? <Loader2 className="animate-spin mr-2" /> : <Square className="mr-2" size={24} />}
                  Complete Session
                </Button>
              </CardFooter>
            </Card>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
