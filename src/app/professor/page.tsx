
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Play, Square, CheckCircle2, Clock, MapPin, GraduationCap, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProfessorPortal() {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Form State
  const [room, setRoom] = useState("");
  const [college, setCollege] = useState("");
  const [program, setProgram] = useState("");
  const [section, setSection] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - sessionStartTime.getTime();
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setElapsedTime(`${h}:${m}:${s}`);
        
        // Auto logout reminder simulation (e.g., if > 4 hours)
        if (diff > 4 * 3600000) {
          // In a real app, this might show a toast or alert
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, sessionStartTime]);

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    setSessionStartTime(new Date());
    setIsActive(true);
    setShowConfirmation(false);
  };

  const handleEndSession = () => {
    setIsActive(false);
    setShowConfirmation(true);
    setSessionStartTime(null);
    setElapsedTime("00:00:00");
  };

  const handleLogout = () => {
    if (isActive) {
      if (confirm("You have an active session. End session and log out?")) {
        handleEndSession();
        router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary text-white py-4 px-6 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
          <GraduationCap size={24} className="text-secondary" />
          <h1 className="text-xl font-bold font-headline">NEU LabTrack</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">Dr. John Doe</p>
            <p className="text-[10px] text-white/70 uppercase">Faculty of Computer Studies</p>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-4">
        {showConfirmation && (
          <Alert className="mb-6 bg-accent text-white border-none shadow-md animate-in slide-in-from-top-4">
            <CheckCircle2 className="h-4 w-4 text-white" />
            <AlertTitle>Session Logged Successfully</AlertTitle>
            <AlertDescription>
              Thank you for using Room <span className="font-bold">{room}</span>. Your usage has been recorded.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {!isActive ? (
              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play size={20} className="text-primary" />
                    Start New Lab Session
                  </CardTitle>
                  <CardDescription>
                    Fill in the details below to begin tracking your lab room usage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="session-form" onSubmit={handleStartSession} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="room">Room Number</Label>
                        <Select onValueChange={setRoom} required>
                          <SelectTrigger id="room">
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COM LAB 1">COM LAB 1</SelectItem>
                            <SelectItem value="COM LAB 2">COM LAB 2</SelectItem>
                            <SelectItem value="PHY LAB">PHY LAB</SelectItem>
                            <SelectItem value="CHEM LAB">CHEM LAB</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="college">College</Label>
                        <Select onValueChange={setCollege} required>
                          <SelectTrigger id="college">
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="program">Program</Label>
                        <Input id="program" placeholder="e.g., BSCS" onChange={(e) => setProgram(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section">Section</Label>
                        <Input id="section" placeholder="e.g., 3B" onChange={(e) => setSection(e.target.value)} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Time Started</Label>
                      <div className="p-3 bg-slate-50 border rounded-md text-sm text-muted-foreground flex items-center gap-2">
                        <Clock size={16} />
                        Current time will be used as start time
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter>
                  <Button form="session-form" className="w-full bg-primary hover:bg-primary/90">
                    <Play className="mr-2" size={18} />
                    Start Session
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card className="shadow-lg border-primary/20 bg-primary/5">
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                    <Clock size={32} className="animate-pulse" />
                  </div>
                  <CardTitle className="text-2xl font-headline text-primary">Active Session</CardTitle>
                  <CardDescription>
                    Your usage of <span className="font-bold text-foreground">{room}</span> is being tracked.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white rounded-xl p-8 shadow-inner border text-center space-y-2">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Session Duration</p>
                    <p className="text-5xl font-mono font-bold text-primary tabular-nums">{elapsedTime}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <MapPin size={18} className="text-primary" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Room</p>
                        <p className="text-sm font-semibold">{room}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <Clock size={18} className="text-primary" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Started At</p>
                        <p className="text-sm font-semibold">{sessionStartTime?.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="destructive" className="w-full h-12" onClick={handleEndSession}>
                    <Square className="mr-2" size={18} />
                    End Session
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-secondary/10 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle size={18} className="text-secondary" />
                  Real-Time Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[
                    { room: 'COM LAB 1', status: 'available' },
                    { room: 'COM LAB 2', status: 'in-use' },
                    { room: 'PHY LAB', status: 'available' },
                    { room: 'CHEM LAB', status: 'available' }
                  ].map((item) => (
                    <div key={item.room} className="flex justify-between items-center p-4">
                      <span className="text-sm font-medium">{item.room}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.status === 'available' ? 'bg-accent' : 'bg-destructive'}`} />
                        <span className="text-xs text-muted-foreground capitalize">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-base">Support & Help</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400 mb-4">
                  For login issues or incorrect room assignments, please contact the CICS IT Support.
                </p>
                <Button variant="outline" size="sm" className="w-full text-black border-slate-700 hover:bg-slate-800 hover:text-white transition-colors">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
