
"use client";

import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, Monitor, Users, Settings, LogOut, GraduationCap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  { title: "Usage Logs", icon: FileText, href: "/admin/logs" },
  { title: "Laboratory Rooms", icon: Monitor, href: "/admin/rooms" },
  { title: "Professors", icon: Users, href: "/admin/professors" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        <Sidebar className="border-r shadow-sm">
          <SidebarHeader className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <GraduationCap size={18} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-primary font-headline">NEU LabTrack</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Admin Portal</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2 pt-6">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className={`h-11 px-4 ${pathname === item.href ? 'bg-primary text-white hover:bg-primary/90 hover:text-white' : ''}`}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span className="font-medium">{item.title}</span>
                      {pathname === item.href && <ChevronRight size={14} className="ml-auto" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t mt-auto">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              onClick={() => router.push("/")}
            >
              <LogOut size={18} className="mr-3" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-px bg-slate-200" />
              <h2 className="font-semibold text-slate-700 capitalize">
                {pathname.split("/").pop()?.replace("-", " ")}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-xs font-medium">System Online</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
