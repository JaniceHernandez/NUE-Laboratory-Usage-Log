
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileDown, Calendar, Database, Users, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const db = useFirestore();

  const sessionsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "sessions"), orderBy("startTime", "desc"));
  }, [db]);

  const { data: sessions, loading } = useCollection<any>(sessionsQuery);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session: any) => 
      session.professorEmail?.toLowerCase().includes(search.toLowerCase()) ||
      session.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
      session.program?.toLowerCase().includes(search.toLowerCase())
    );
  }, [sessions, search]);

  const totalHours = useMemo(() => {
    const minutes = sessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
    return (minutes / 60).toFixed(1);
  }, [sessions]);

  if (loading) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Usage Logs</p>
          <h1 className="text-3xl font-extrabold text-slate-800 leading-none">Usage Logs</h1>
          <p className="text-sm text-slate-400 font-medium mt-2">Monitor and export laboratory utilization records.</p>
        </div>
        <Button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-6 h-12 flex items-center gap-2 font-bold transition-all">
          <FileDown size={20} />
          Export Data
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search by professor email, room, or program..." 
                className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 bg-white gap-2 text-xs font-bold uppercase tracking-wider">
                <Calendar size={16} />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Professor</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Room</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">College</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Program/Section</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Start Time</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Duration</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session: any) => (
                  <TableRow key={session.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100 rounded-xl shadow-sm">
                          <AvatarFallback className="rounded-xl text-[10px] font-bold">
                            {session.professorEmail.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-slate-800">{session.professorEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-600">{session.roomNumber}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-500">{session.college}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <span className="text-sm font-semibold text-slate-700">{session.program}-{session.section}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-400">
                        {session.startTime?.toDate ? format(session.startTime.toDate(), "MMM dd, hh:mm a") : "---"}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <Badge variant="outline" className="bg-slate-50 border-none text-[10px] font-bold text-slate-600 px-3 py-1">
                        {session.duration ? `${session.duration} mins` : '--'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-none ${
                        session.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {session.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                      No logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white flex items-center p-6 gap-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
            <Database size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Hours Logged</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">{totalHours} hrs</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white flex items-center p-6 gap-6">
          <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Sessions</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">{sessions.length}</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white flex items-center p-6 gap-6">
          <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Active Sessions</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">
              {sessions.filter((s: any) => s.status === 'active').length}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
