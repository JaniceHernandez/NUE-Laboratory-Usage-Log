"use client";

import { useState } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, Monitor, Users, Settings, LogOut, GraduationCap, BarChart3, Search, User, Shield, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { AuthGuard } from "@/components/auth-guard";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { title: "Usage Logs", icon: FileText, href: "/admin/logs" },
  { title: "Room Management", icon: Monitor, href: "/admin/rooms" },
  { title: "Professor Management", icon: Users, href: "/admin/professors" },
  { title: "Reports", icon: BarChart3, href: "/admin/reports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !db) return;

    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { name: displayName });

      toast({
        title: "Settings Updated",
        description: "Your administrative profile has been successfully updated.",
      });
      setIsSettingsOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-white">
          <Sidebar className="border-r border-slate-100 bg-white">
            <SidebarHeader className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                  {/* Placeholder for the NEU Logo uploaded by the user */}
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 bg-primary/5 flex items-center justify-center text-primary">
                      <GraduationCap size={20} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-[10px] font-black text-slate-900 leading-tight uppercase tracking-tight">NEW ERA UNIVERSITY</h1>
                  <p className="text-[9px] text-primary font-bold mt-0.5 leading-none">LABORATORY USAGE LOG</p>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent className="px-3 pt-4">
              <SidebarMenu className="gap-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={`h-11 px-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90 hover:text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                          <span className="font-semibold">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-slate-50 bg-slate-50/30">
              <div className="space-y-1">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-10 px-4 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl"
                  onClick={() => {
                    setDisplayName(user?.displayName || "");
                    setIsSettingsOpen(true);
                  }}
                >
                  <Settings size={18} className="mr-3" />
                  <span className="font-medium text-sm">Settings</span>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-10 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                  onClick={handleLogout}
                >
                  <LogOut size={18} className="mr-3" />
                  <span className="font-medium text-sm">Logout</span>
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
          
          <SidebarInset className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
            <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
              <div className="flex items-center gap-6 flex-1 max-w-2xl">
                <SidebarTrigger className="text-slate-400 hover:text-slate-900" />
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                  <Input 
                    placeholder="Search usage logs, rooms, or professors..." 
                    className="pl-12 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-primary transition-colors">{user?.displayName || "Admin User"}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{user?.email}</p>
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-slate-100 group-hover:border-primary/20 transition-all rounded-xl">
                    <AvatarFallback className="rounded-xl text-xs font-bold text-slate-500 bg-slate-50">
                      {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </SidebarInset>
        </div>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8">
            <DialogHeader>
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
                <Shield size={24} />
              </div>
              <DialogTitle className="text-2xl font-bold">Admin Settings</DialogTitle>
              <DialogDescription>Update your administrative profile and system preferences.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateProfile} className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <User size={14} /> Full Name
                  </Label>
                  <Input 
                    id="displayName" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="System Administrator" 
                    className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Account Access</Label>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <p className="text-xs font-bold text-slate-700">{user?.email}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Verified Institutional Admin</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-12 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20 gap-2" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={18} />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </AuthGuard>
  );
}
