"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, Monitor, Users, Settings, LogOut, GraduationCap, ChevronRight, BarChart3, Bell, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-white">
        <Sidebar className="border-r border-slate-100 bg-white">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <GraduationCap size={20} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-bold text-slate-900 leading-none">NEU Lab Management</h1>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Laboratory Usage Log</p>
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
              <Button variant="ghost" className="w-full justify-start h-10 px-4 text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl">
                <Settings size={18} className="mr-3" />
                <span className="font-medium text-sm">Settings</span>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-10 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                onClick={() => router.push("/")}
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
              <Button variant="ghost" size="icon" className="text-slate-400 rounded-xl hover:bg-slate-50 relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </Button>
              <div className="h-8 w-px bg-slate-100" />
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-primary transition-colors">Admin User</p>
                  <p className="text-[10px] text-slate-400 mt-1">admin@neu.edu.ph</p>
                </div>
                <Avatar className="h-10 w-10 border-2 border-slate-100 group-hover:border-primary/20 transition-all rounded-xl">
                  <AvatarImage src="https://picsum.photos/seed/admin/100/100" />
                  <AvatarFallback className="rounded-xl">AD</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}