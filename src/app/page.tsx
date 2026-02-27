"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, ShieldCheck, GraduationCap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/admin/dashboard");
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.push("/professor");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-slate-100">
      <div className="mb-12 text-center space-y-2">
        <h1 className="text-xl font-medium text-slate-500 uppercase tracking-widest">Laboratory Usage Management System</h1>
      </div>

      <Card className="w-full max-w-[480px] border-none shadow-2xl rounded-[24px] overflow-hidden">
        <Tabs defaultValue="professor" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-16 bg-slate-100/50 p-1 rounded-none">
            <TabsTrigger value="professor" className="rounded-none h-full data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-primary font-semibold">
              Professor Check-in
            </TabsTrigger>
            <TabsTrigger value="admin" className="rounded-none h-full data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:text-primary font-semibold">
              Admin Login
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="professor" className="p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                <QrCode size={40} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Scan to Check-in</h2>
                <p className="text-slate-500 text-sm max-w-[280px] mx-auto leading-relaxed">
                  Use the QR code scanner at the laboratory entrance. Your browser will be directed to your personalized check-in page.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-slate-400">
                <span className="bg-white px-4">or use google</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-14 rounded-xl border-slate-200 bg-white hover:bg-slate-50 hover:border-primary text-slate-700 flex items-center justify-center gap-3 transition-all"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              <span className="font-semibold">Sign in with @neu.edu.ph</span>
            </Button>
            <p className="text-[10px] text-center text-slate-400 font-medium">Demo: Use Mock Login</p>
          </TabsContent>

          <TabsContent value="admin" className="p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-2 mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-2">
                <ShieldCheck size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Admin Portal</h2>
              <p className="text-slate-500 text-sm">Secure access for management personnel.</p>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@neu.edu.ph" 
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required 
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold transition-all shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : "Login to Dashboard"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      <footer className="mt-12 text-slate-400 text-xs font-medium">
        &copy; {new Date().getFullYear()} New Era University. All rights reserved.
      </footer>
    </div>
  );
}