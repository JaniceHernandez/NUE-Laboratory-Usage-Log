
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, ShieldCheck, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary font-headline">NEU LabTrack</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Laboratory Usage Log</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
          <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-primary font-headline">Welcome to LabTrack</h2>
              <p className="text-muted-foreground">The official laboratory room usage logging system of New Era University.</p>
            </div>

            <div className="grid gap-4">
              <Link href="/login?role=professor">
                <Card className="hover:border-primary transition-all cursor-pointer group hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                      <GraduationCap size={20} className="text-primary" />
                      Institutional Login
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      For Professors and Faculty members using @neu.edu.ph institutional email.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/login?role=admin">
                <Card className="hover:border-primary transition-all cursor-pointer group hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                      <ShieldCheck size={20} className="text-primary" />
                      Admin Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Secure administrative portal for managing rooms, accounts, and analytics.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="pt-6 border-t text-center">
              <p className="text-xs text-muted-foreground mb-4">Demo ID Scanner login simulated in Professor portal</p>
              <div className="flex items-center justify-center gap-4">
                <Image 
                  src="https://picsum.photos/seed/neu_logo/100/100" 
                  alt="NEU Logo" 
                  width={40} 
                  height={40} 
                  className="grayscale opacity-50"
                  data-ai-hint="university logo"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block flex-1 relative overflow-hidden">
          <Image
            src="https://picsum.photos/seed/neu1/1200/800"
            alt="NEU Campus"
            fill
            className="object-cover"
            priority
            data-ai-hint="university campus"
          />
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px]" />
          <div className="absolute bottom-12 left-12 right-12 text-white space-y-2">
            <h3 className="text-2xl font-bold font-headline">Excellence and Integrity</h3>
            <p className="text-white/80 max-w-sm">Efficiently managing our educational resources to provide the best learning environment for every student.</p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t py-4 px-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} New Era University. All rights reserved.
      </footer>
    </div>
  );
}
