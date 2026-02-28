
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileDown, Calendar, Database, Users, AlertCircle, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function LogsPage() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const db = useFirestore();
  const { toast } = useToast();

  const sessionsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "sessions"), orderBy("startTime", "desc"));
  }, [db]);

  const { data: sessions, loading } = useCollection<any>(sessionsQuery);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session: any) => {
      const matchesSearch = 
        session.professorEmail?.toLowerCase().includes(search.toLowerCase()) ||
        session.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
        session.program?.toLowerCase().includes(search.toLowerCase()) ||
        session.college?.toLowerCase().includes(search.toLowerCase());
      
      if (!dateFilter) return matchesSearch;

      const sessionDate = session.startTime?.toDate();
      if (!sessionDate) return false;

      const isSameDay = isWithinInterval(sessionDate, {
        start: startOfDay(dateFilter),
        end: endOfDay(dateFilter)
      });

      return matchesSearch && isSameDay;
    });
  }, [sessions, search, dateFilter]);

  const totalHours = useMemo(() => {
    const minutes = sessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
    return (minutes / 60).toFixed(1);
  }, [sessions]);

  const handleExportCSV = () => {
    if (filteredSessions.length === 0) return;

    const headers = ["ID", "Professor", "Room", "College", "Program", "Section", "Start Time", "Duration (Min)", "Status"];
    const rows = filteredSessions.map(s => [
      s.id,
      s.professorEmail,
      s.roomNumber,
      s.college,
      s.program,
      s.section,
      s.startTime?.toDate ? format(s.startTime.toDate(), "yyyy-MM-dd HH:mm:ss") : "N/A",
      s.duration || 0,
      s.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NEU_LabTrack_Logs_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Success",
      description: "Laboratory usage logs have been exported."
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Audit Trail</p>
          <h1 className="text-3xl font-extrabold text-slate-800 leading-none">Usage Logs</h1>
          <p className="text-sm text-slate-400 font-medium mt-2">Comprehensive record of all laboratory utilization.</p>
        </div>
        <Button 
          variant="outline"
          className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-6 h-12 flex items-center gap-2 font-bold transition-all shadow-sm"
          onClick={handleExportCSV}
          disabled={filteredSessions.length === 0}
        >
          <FileDown size={20} />
          Export CSV
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50 bg-slate-50/30">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
              <Input 
                placeholder="Search by faculty email, room number, or program..." 
                className="pl-12 h-12 bg-white border-slate-100 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 shadow-sm transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative group">
                <Input 
                  type="date" 
                  className="h-12 bg-white border-slate-100 rounded-xl px-4 shadow-sm text-sm"
                  onChange={(e) => setDateFilter(e.target.value ? new Date(e.target.value) : null)}
                />
                {dateFilter && (
                  <button 
                    onClick={() => setDateFilter(null)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Professor</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Facility</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">College</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Details</TableHead>
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
                        <Avatar className="h-10 w-10 border border-slate-100 rounded-xl shadow-sm bg-slate-50">
                          <AvatarFallback className="rounded-xl text-[10px] font-bold text-slate-500">
                            {session.professorEmail?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-slate-700">{session.professorEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-none px-3 py-1 font-bold text-[10px]">
                        {session.roomNumber}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-500">{session.college}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{session.program}</span>
                        <span className="text-[10px] text-slate-400">Section {session.section}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-400">
                        {session.startTime?.toDate ? format(session.startTime.toDate(), "MMM dd, hh:mm a") : "---"}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-600">
                        {session.duration ? `${session.duration}m` : '--'}
                      </span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border-none ${
                        session.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {session.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-slate-400 font-medium italic">
                      No matching utilization records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white flex items-center p-6 gap-6 transition-all hover:shadow-md">
          <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <Database size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Utilization</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">{totalHours} hrs</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white flex items-center p-6 gap-6 transition-all hover:shadow-md">
          <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Faculty Logs</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">{sessions.length}</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white flex items-center p-6 gap-6 transition-all hover:shadow-md">
          <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Active Now</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">
              {sessions.filter((s: any) => s.status === 'active').length}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
