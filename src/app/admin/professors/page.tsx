"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  UserX, UserCheck, Search, ShieldAlert, 
  Mail, Loader2, Users, ShieldCheck, 
  Lock, ShieldMinus, UserPlus, Trash2 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, DocumentReference } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { UserService, UserProfile } from "@/services/user-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfessorsPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const db = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminProfileRef = useMemo(() => 
    (db && authUser) ? (doc(db, "users", authUser.uid) as DocumentReference<UserProfile>) : null, 
    [db, authUser]
  );
  const { data: adminProfile } = useDoc<UserProfile>(adminProfileRef);

  const { data: allUsers, loading } = useCollection<UserProfile>(
    useMemo(() => db ? collection(db, "users") : null, [db])
  );

  const professors = useMemo(() => allUsers.filter(u => u.role === 'professor'), [allUsers]);
  const administrators = useMemo(() => allUsers.filter(u => u.role === 'admin'), [allUsers]);

  const filteredProfessors = useMemo(() => {
    return professors.filter(p => 
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.college && p.college.toLowerCase().includes(search.toLowerCase()))
    );
  }, [professors, search]);

  const filteredAdmins = useMemo(() => {
    return administrators.filter(a => 
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      (a.name && a.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [administrators, search]);

  const isSuperAdmin = useMemo(() => UserService.isSuperAdmin(adminProfile), [adminProfile]);

  const handleUpdateStatus = async (targetUser: UserProfile) => {
    if (!db || !adminProfile) return;

    // Permissions check: 
    // Super admin can block anyone. 
    // Admins can only block professors.
    const canManage = isSuperAdmin || targetUser.role === 'professor';

    if (!canManage) {
      toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to manage this account." });
      return;
    }

    const newStatus = targetUser.status === "blocked" ? "active" : "blocked";
    const userRef = doc(db, "users", targetUser.uid!);

    try {
      await updateDoc(userRef, { status: newStatus });
      toast({ title: "Updated", description: `${targetUser.name || targetUser.email} status set to ${newStatus.toUpperCase()}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update account status." });
    }
  };

  const handleDeleteUser = async (targetUser: UserProfile) => {
    if (!db || !isSuperAdmin) {
      toast({ variant: "destructive", title: "Access Denied", description: "Only the Super Admin can delete/revoke accounts." });
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete/revoke ${targetUser.email}? This action cannot be undone.`)) return;

    try {
      await UserService.deleteUser(db, targetUser.uid!);
      toast({ title: "Account Revoked", description: `${targetUser.email} has been removed from the system.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete account." });
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !inviteEmail) return;

    if (!inviteEmail.endsWith("@neu.edu.ph")) {
      toast({ variant: "destructive", title: "Invalid Domain", description: "Only @neu.edu.ph emails are authorized." });
      return;
    }

    setIsSubmitting(true);
    try {
      await UserService.authorizeAdminEmail(db, inviteEmail);
      toast({ title: "Authorization Added", description: `${inviteEmail} is now an authorized administrator.` });
      setIsAddAdminOpen(false);
      setInviteEmail("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to Authorize", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Institutional Access</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-800 leading-none">Management Portal</h1>
            {isSuperAdmin && (
              <Badge className="bg-primary/10 text-primary border-none font-bold text-[10px] uppercase tracking-widest px-2.5 py-1">
                <ShieldCheck size={12} className="mr-1" /> Super Admin
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 font-medium mt-2">Oversee faculty authorization and system administrators.</p>
        </div>
        {isSuperAdmin && (
          <Button 
            onClick={() => setIsAddAdminOpen(true)}
            className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-12 shadow-lg shadow-primary/20 flex items-center gap-2 font-bold transition-all"
          >
            <UserPlus size={20} />
            Authorize New Admin
          </Button>
        )}
      </div>

      <Tabs defaultValue="professors" className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <TabsList className="bg-white p-1 h-12 rounded-2xl shadow-sm border border-slate-100">
            <TabsTrigger value="professors" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users size={16} className="mr-2" /> Professors ({professors.length})
            </TabsTrigger>
            <TabsTrigger value="admins" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              <ShieldCheck size={16} className="mr-2" /> Admins ({administrators.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <Input 
              placeholder="Search by name, email, or college..." 
              className="pl-12 h-12 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="professors" className="animate-in slide-in-from-left-4 duration-300">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty Name</TableHead>
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Email</TableHead>
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">College</TableHead>
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</TableHead>
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessors.map((prof) => (
                    <TableRow key={prof.uid} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm">
                            <AvatarImage src={prof.photoURL || undefined} />
                            <AvatarFallback className="rounded-xl bg-slate-50 text-primary text-[10px] font-black">
                              {(prof.name || prof.email).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-slate-700">{prof.name || "No Name"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Mail size={14} className="text-slate-300" />
                          {prof.email}
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none font-bold text-[10px] px-3 py-1">
                          {prof.college || "Not Affiliated"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        {prof.status === 'blocked' ? (
                          <Badge variant="destructive" className="bg-red-50 text-red-600 border-none font-bold text-[9px] uppercase tracking-widest px-2.5 py-1">Blocked</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-50 text-green-600 border-none font-bold text-[9px] uppercase tracking-widest px-2.5 py-1">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`rounded-xl h-9 px-4 font-bold text-[10px] transition-all ${
                              prof.status === 'blocked' ? "text-primary border-primary/20 hover:bg-primary/5" : "text-red-500 border-red-100 hover:bg-red-50"
                            }`}
                            onClick={() => handleUpdateStatus(prof)}
                          >
                            {prof.status === 'blocked' ? <UserCheck size={14} className="mr-2" /> : <UserX size={14} className="mr-2" />}
                            {prof.status === 'blocked' ? 'Unblock' : 'Block'}
                          </Button>
                          {isSuperAdmin && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="rounded-xl h-9 w-9 p-0 text-red-500 hover:bg-red-50"
                              onClick={() => handleDeleteUser(prof)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="animate-in slide-in-from-right-4 duration-300">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Name</TableHead>
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Level</TableHead>
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institutional Email</TableHead>
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.uid || admin.email} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm">
                            <AvatarImage src={admin.photoURL || undefined} />
                            <AvatarFallback className="rounded-xl bg-primary/5 text-primary text-[10px] font-black">
                              {(admin.name || admin.email).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-slate-700">
                            {admin.name || "System Admin"} 
                            {!admin.uid && <span className="ml-2 text-[8px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Invited</span>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        {UserService.isSuperAdmin(admin) ? (
                          <Badge className="bg-primary text-white border-none font-bold text-[8px] uppercase tracking-widest px-2.5 py-1">Super Admin</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-bold text-[8px] uppercase tracking-widest px-2.5 py-1">Management</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Mail size={14} className="text-slate-300" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {isSuperAdmin && !UserService.isSuperAdmin(admin) && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={`rounded-xl h-9 px-4 font-bold text-[10px] transition-all ${
                                  admin.status === 'blocked' ? "text-primary border-primary/20 hover:bg-primary/5" : "text-red-500 border-red-100 hover:bg-red-50"
                                }`}
                                onClick={() => handleUpdateStatus(admin)}
                              >
                                {admin.status === 'blocked' ? 'Unblock' : 'Block'}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="rounded-xl h-9 w-9 p-0 text-red-500 hover:bg-red-50"
                                onClick={() => handleDeleteUser(admin)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <UserPlus size={24} />
            </div>
            <DialogTitle className="text-2xl font-bold">Authorize Admin</DialogTitle>
            <DialogDescription>
              Authorize an institutional email to access the administrative dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAdmin} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-xs font-bold uppercase tracking-widest text-slate-400">Institutional Email (@neu.edu.ph)</Label>
              <Input 
                id="admin-email"
                type="email"
                placeholder="colleague@neu.edu.ph"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full h-12 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize Email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}