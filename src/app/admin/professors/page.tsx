"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Search, ShieldCheck, 
  Loader2, Trash2, UserPlus, Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase";
import { Query, collection, doc, updateDoc, DocumentReference } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  isSuperAdmin, 
  authorizeAdminEmail, 
  deleteAuthorizedAdmin, 
  UserProfile, 
  AuthorizedAdmin 
} from "@/services/user-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function IdentityManagementPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
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
  const { data: currentAdminProfile } = useDoc<UserProfile>(adminProfileRef);

  const { data: allUsers, loading: usersLoading } = useCollection<UserProfile & { id: string }>(
    useMemo(() => db ? (collection(db, "users") as Query<UserProfile & { id: string }>) : null, [db])
  );

  const { data: authAdmins, loading: authAdminsLoading } = useCollection<AuthorizedAdmin & { id: string }>(
    useMemo(() => db ? (collection(db, "authorizedAdmins") as Query<AuthorizedAdmin & { id: string }>) : null, [db])
  );

  const professors = useMemo(() => allUsers.filter(u => u.role === 'professor'), [allUsers]);
  
  const administrators = useMemo(() => {
    const activeAdmins = allUsers.filter(u => u.role === 'admin');
    
    // Find pre-authorized admins who haven't logged in yet
    const pendingAdmins = authAdmins
      .filter(auth => !activeAdmins.some(active => active.email?.toLowerCase() === auth.email?.toLowerCase()))
      .map(p => ({
        id: p.email,
        email: p.email,
        role: 'admin' as const,
        status: 'active' as const,
        type: 'pending' as const,
        name: null,
        photoURL: null
      }));
    
    return [
      ...activeAdmins.map(a => ({ ...a, type: 'active' as const })),
      ...pendingAdmins
    ];
  }, [allUsers, authAdmins]);

  const filteredProfessors = useMemo(() => {
    return professors.filter(p => 
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [professors, search]);

  const filteredAdmins = useMemo(() => {
    return administrators.filter(a => 
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      (a.name && a.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [administrators, search]);

  const superAdminFlag = useMemo(() => isSuperAdmin(currentAdminProfile), [currentAdminProfile]);

  const handleUpdateStatus = async (targetUser: UserProfile & { id: string }) => {
    if (!db || (!superAdminFlag && targetUser.role === 'admin')) {
      toast({ variant: "destructive", title: "Access Denied", description: "Insufficient privileges." });
      return;
    }

    const newStatus = targetUser.status === "blocked" ? "active" : "blocked";
    try {
      await updateDoc(doc(db, "users", targetUser.id), { status: newStatus });
      toast({ title: "Updated", description: `Account status set to ${newStatus.toUpperCase()}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update account status." });
    }
  };

  const handleRevokeAdmin = async (email: string) => {
    if (!db || !superAdminFlag) return;
    if (!confirm(`Revoke administrative access for ${email}?`)) return;

    try {
      await deleteAuthorizedAdmin(db, email);
      const existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        await updateDoc(doc(db, "users", existing.id), { role: 'professor' });
      }
      toast({ title: "Access Revoked", description: `${email} is no longer an administrator.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to revoke access." });
    }
  };

  const handleAuthorizeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !adminEmail || !superAdminFlag) return;

    setIsSubmitting(true);
    try {
      await authorizeAdminEmail(db, adminEmail, authUser?.email || 'Super Admin');
      toast({ title: "Admin Authorized", description: `${adminEmail} has been added to the registry.` });
      setIsAdminDialogOpen(false);
      setAdminEmail("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || usersLoading || authAdminsLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading IAM Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Identify & Access Management</p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-slate-800 leading-none tracking-tight">Identity Registry</h1>
            {superAdminFlag && (
              <Badge className="bg-primary/10 text-primary border-none font-bold text-[10px] uppercase tracking-widest px-2.5 py-1">
                <ShieldCheck size={12} className="mr-1" /> Super Admin
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 font-medium mt-2">Oversee institutional faculty access and administrative roles.</p>
        </div>
        {superAdminFlag && (
          <Button 
            onClick={() => setIsAdminDialogOpen(true)} 
            className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-12 shadow-lg shadow-primary/20 flex items-center gap-2 font-bold transition-all"
          >
            <UserPlus size={20} />
            Authorize Admin
          </Button>
        )}
      </div>

      <Tabs defaultValue="professors" className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <TabsList className="bg-white p-1 h-12 rounded-2xl shadow-sm border border-slate-100">
            <TabsTrigger value="professors" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Professors ({professors.length})
            </TabsTrigger>
            <TabsTrigger value="admins" className="rounded-xl px-6 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
              Administrators ({administrators.length})
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <Input 
              placeholder="Search registry..." 
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
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</TableHead>
                    <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfessors.map((prof) => (
                    <TableRow key={prof.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm">
                            <AvatarImage src={prof.photoURL || undefined} />
                            <AvatarFallback className="rounded-xl bg-slate-50 text-primary text-[10px] font-black">
                              {(prof.name || prof.email || "AP").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-slate-700">{prof.name || "Authorized Professor"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5 text-xs text-slate-500 font-medium">
                        {prof.email}
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        <Badge variant={prof.status === 'blocked' ? "destructive" : "secondary"} className="font-bold text-[9px] uppercase px-2.5 py-1">
                          {prof.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl h-9 px-4 font-bold text-[10px]"
                          onClick={() => handleUpdateStatus(prof)}
                        >
                          {prof.status === 'blocked' ? 'Unblock' : 'Block'}
                        </Button>
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
                  {filteredAdmins.map((admin: any) => (
                    <TableRow key={admin.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl border border-slate-100 shadow-sm">
                            <AvatarImage src={admin.photoURL || undefined} />
                            <AvatarFallback className="rounded-xl bg-primary/5 text-primary text-[10px] font-black">
                              {(admin.name || admin.email || "AA").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-slate-700">{admin.name || (admin.type === 'pending' ? 'Pre-authorized' : 'Institutional Admin')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-5">
                        {admin.type === 'pending' ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-600 border-none font-bold text-[8px] uppercase tracking-widest px-2.5 py-1">
                            <Clock size={10} className="mr-1" /> Pending
                          </Badge>
                        ) : isSuperAdmin(admin) ? (
                          <Badge className="bg-primary text-white border-none font-bold text-[8px] uppercase tracking-widest px-2.5 py-1">Super Admin</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-bold text-[8px] uppercase tracking-widest px-2.5 py-1">Management</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-8 py-5 text-xs text-slate-500 font-medium">
                        {admin.email}
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        {superAdminFlag && !isSuperAdmin(admin) && (
                          <div className="flex justify-end gap-2">
                             {admin.type !== 'pending' && (
                               <Button 
                                variant="outline" 
                                size="sm" 
                                className="rounded-xl h-9 px-4 font-bold text-[10px]"
                                onClick={() => handleUpdateStatus(admin)}
                              >
                                {admin.status === 'blocked' ? 'Unblock' : 'Block'}
                              </Button>
                             )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="rounded-xl h-9 w-9 p-0 text-red-500 hover:bg-red-50"
                              onClick={() => handleRevokeAdmin(admin.email)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8">
          <DialogHeader>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <UserPlus size={24} />
            </div>
            <DialogTitle className="text-2xl font-bold">Authorize Admin</DialogTitle>
            <DialogDescription>Add a verified institutional email to the administrative registry.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAuthorizeAdmin} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-xs font-bold uppercase tracking-widest text-slate-400">Institutional Email</Label>
              <Input 
                id="adminEmail" 
                type="email" 
                placeholder="example@neu.edu.ph" 
                className="h-12 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-12 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Grant Authorization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
