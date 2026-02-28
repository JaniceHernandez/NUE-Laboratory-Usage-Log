
"use client";

import { useMemo } from "react";
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
  const db = useFirestore();
  const { toast } = useToast();

  const professorsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "users"), where("role", "==", "professor"));
  }, [db]);

  const { data: professors, loading } = useCollection<any>(professorsQuery);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-headline">Professor Management</h1>
          <p className="text-sm text-muted-foreground">Manage faculty access and institutional email authorization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-destructive/5 border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {professors.filter(p => p.status === 'blocked').length}
                </p>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Blocked Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input placeholder="Search professors..." className="pl-10 h-10 bg-slate-50 border-none" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Institutional Email</TableHead>
                <TableHead className="font-bold">Access Status</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professors.map((prof) => (
                <TableRow key={prof.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {(prof.name || prof.email).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-700">{prof.name || "No Name"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail size={12} />
                      {prof.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {prof.status === 'blocked' ? (
                      <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100">Blocked</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-100">Authorized</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={prof.status === 'blocked' ? "text-accent border-accent hover:bg-accent/5" : "text-destructive border-destructive hover:bg-destructive/5"}
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
                          Block Account
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {professors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-400">
                    No professors registered yet.
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
