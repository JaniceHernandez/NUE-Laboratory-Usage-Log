"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserX, UserCheck, Search, ShieldAlert, Mail, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";

export default function ProfessorsPage() {
  const [search, setSearch] = useState("");
  const db = useFirestore();
  const { toast } = useToast();

  const professorsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "users"), where("role", "==", "professor"));
  }, [db]);

  const { data: professors, loading } = useCollection<any>(professorsQuery);

  const filteredProfessors = useMemo(() => {
    return professors.filter(p => 
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.college?.toLowerCase().includes(search.toLowerCase())
    );
  }, [professors, search]);

  const toggleBlock = (userId: string, currentStatus: string, name: string) => {
    if (!db) return;
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    const userRef = doc(db, "users", userId);

    updateDoc(userRef, { status: newStatus })
      .then(() => {
        toast({
          title: "Status Updated",
          description: `Professor ${name} has been ${newStatus.toUpperCase()}.`,
        });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: "update",
          requestResourceData: { status: newStatus },
        });
        errorEmitter.emit("permission-error", permissionError);
      });
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Faculty Control</p>
          <h1 className="text-3xl font-extrabold text-slate-800 leading-none">Professor Management</h1>
          <p className="text-sm text-slate-400 font-medium mt-2">Manage faculty access and institutional authorization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-red-50/50 border-l-4 border-l-red-500 rounded-[1.5rem]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800">
                  {professors.filter(p => p.status === 'blocked').length}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Blocked Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <Input 
              placeholder="Search professors by name, email, or college..." 
              className="pl-12 h-12 bg-white border-slate-100 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 shadow-sm transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Name / Identity</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Institutional Email</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">College</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Access Status</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfessors.map((prof) => (
                <TableRow key={prof.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary text-xs font-black shadow-sm border border-primary/10">
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
                      {prof.college || "Unassigned"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    {prof.status === 'blocked' ? (
                      <Badge variant="destructive" className="bg-red-50 text-red-600 border-none font-bold text-[9px] uppercase tracking-widest px-2.5 py-1">Blocked</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-50 text-green-600 border-none font-bold text-[9px] uppercase tracking-widest px-2.5 py-1">Authorized</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`rounded-xl h-9 px-4 font-bold text-[10px] transition-all ${
                        prof.status === 'blocked' 
                          ? "text-primary border-primary/20 hover:bg-primary/5" 
                          : "text-red-500 border-red-100 hover:bg-red-50"
                      }`}
                      onClick={() => toggleBlock(prof.id, prof.status, prof.name || prof.email)}
                    >
                      {prof.status === 'blocked' ? (
                        <>
                          <UserCheck size={14} className="mr-2" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <UserX size={14} className="mr-2" />
                          Block Access
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProfessors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-medium italic">
                    No matching faculty records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}