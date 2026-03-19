"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserX, UserCheck, Search, ShieldAlert, Mail, Loader2, Users, ShieldCheck, Lock, ShieldPlus, ShieldMinus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection, useUser, useDoc } from "@/firebase";
import { collection, query, where, doc, updateDoc, DocumentReference } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";
import { UserService, UserProfile } from "@/services/user-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProfessorsPage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
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

  const handleUpdateStatus = (userId: string, currentStatus: string, name: string) => {
    if (!db) return;
    if (!isSuperAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only the Super Admin can manage account status.",
      });
      return;
    }

    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    const userRef = doc(db, "users", userId);

    updateDoc(userRef, { status: newStatus })
      .then(() => {
        toast({ title: "Updated", description: `${name} status set to ${newStatus.toUpperCase()}.` });
      })
      .catch(async () => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: userRef.path,
          operation: "update",
          requestResourceData: { status: newStatus }
        }));
      });
  };

  const handleUpdateRole = (userId: string, currentRole: string, name: string) => {
    if (!db) return;
    if (!isSuperAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only the Super Admin can manage administrative roles.",
      });
      return;
    }

    const newRole = currentRole === "admin" ? "professor" : "admin";
    const userRef = doc(db, "users", userId);

    updateDoc(userRef, { role: newRole })
      .then(() => {
        toast({ title: "Role Updated", description: `${name} has been promoted to ${newRole.toUpperCase()}.` });
      })
      .catch(async () => {
        errorEmitter.emit("permission-error", new FirestorePermissionError({
          path: userRef.path,
          operation: "update",
          requestResourceData: { role: newRole }
        }));
      });
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
      </div>

      {!isSuperAdmin && (
        <Card className="border-none shadow-sm bg-orange-50/50 border-l-4 border-l-orange-400 rounded-xl">
          <CardContent className="py-4 flex items-center gap-3">
            <Lock className="text-orange-500 shrink-0" size={18} />
            <p className="text-xs font-medium text-orange-700 leading-relaxed">
              <strong>Super Admin Mode Required:</strong> Only the primary system administrator can modify roles or block accounts.
            </p>
          </CardContent>
        </Card>
      )}

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
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary text-xs font-black border border-slate-100">
                            {(prof.name || prof.email).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
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
                          {isSuperAdmin && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="rounded-xl h-9 px-4 font-bold text-[10px] text-primary border-primary/20 hover:bg-primary/5"
                              onClick={() => handleUpdateRole(prof.uid, prof.role, prof.name || prof.email)}
                            >
                              <ShieldPlus size={14} className="mr-2" />
                              Promote to Admin
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={!isSuperAdmin}
                            className={`rounded-xl h-9 px-4 font-bold text-[10px] transition-all ${
                              !isSuperAdmin ? "opacity-50" :
                              prof.status === 'blocked' ? "text-primary border-primary/20 hover:bg-primary/5" : "text-red-500 border-red-100 hover:bg-red-50"
                            }`}
                            onClick={() => handleUpdateStatus(prof.uid, prof.status, prof.name || prof.email)}
                          >
                            {prof.status === 'blocked' ? <UserCheck size={14} className="mr-2" /> : <UserX size={14} className="mr-2" />}
                            {prof.status === 'blocked' ? 'Unblock' : 'Block Access'}
                          </Button>
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
                    <TableRow key={admin.uid} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary text-xs font-black border border-primary/10">
                            {(admin.name || admin.email).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-slate-700">{admin.name || "System Admin"}</span>
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
                        {isSuperAdmin && !UserService.isSuperAdmin(admin) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="rounded-xl h-9 px-4 font-bold text-[10px] text-red-500 hover:bg-red-50"
                            onClick={() => handleUpdateRole(admin.uid, admin.role, admin.name || admin.email)}
                          >
                            <ShieldMinus size={14} className="mr-2" />
                            Revoke Admin
                          </Button>
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
    </div>
  );
}
