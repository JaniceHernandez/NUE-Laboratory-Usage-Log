"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileDown, 
  Loader2, 
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLLEGES = [
  "College of Informatics and Computing Studies",
  "College of Engineering and Architecture",
  "College of Communication",
  "College of Accountancy",
];

export default function ReportsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: sessions, loading: sessionsLoading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "sessions"), orderBy("startTime", "desc")) : null, [db])
  );

  const { data: rooms, loading: roomsLoading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "rooms"), orderBy("number", "asc")) : null, [db])
  );

  const { data: users, loading: usersLoading } = useCollection<any>(
    useMemo(() => db ? collection(db, "users") : null, [db])
  );

  const userMap = useMemo(() => {
    const map: Record<string, { name: string, email: string }> = {};
    users.forEach(u => {
      if (u.email) {
        map[u.email.toLowerCase()] = {
          name: u.name || "Authorized Professor",
          email: u.email
        };
      }
    });
    return map;
  }, [users]);

  const filteredData = useMemo(() => {
    if (!mounted) return [];
    return sessions.filter((s: any) => {
      const date = s.startTime?.toDate ? s.startTime.toDate() : (s.startTime instanceof Date ? s.startTime : null);
      const matchesDate = date ? isWithinInterval(date, {
        start: startOfDay(dateRange.start),
        end: endOfDay(dateRange.end)
      }) : false;

      const profile = userMap[s.professorEmail?.toLowerCase()];
      const matchesSearch = 
        !search || 
        s.professorEmail?.toLowerCase().includes(search.toLowerCase()) ||
        s.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
        (profile?.name?.toLowerCase().includes(search.toLowerCase()));

      const matchesRoom = roomFilter === "all" || s.roomNumber === roomFilter;
      const matchesCollege = collegeFilter === "all" || s.college === collegeFilter;

      return matchesDate && matchesSearch && matchesRoom && matchesCollege;
    });
  }, [sessions, dateRange, search, roomFilter, collegeFilter, mounted, userMap]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ["Professor", "Email", "Room", "College", "Program", "Start Time", "End Time", "Duration (Min)"];
    const rows = filteredData.map(s => {
      const profile = userMap[s.professorEmail?.toLowerCase()];
      return [
        profile?.name || "Unknown",
        s.professorEmail,
        s.roomNumber,
        s.college,
        s.program,
        s.startTime?.toDate ? format(s.startTime.toDate(), "yyyy-MM-dd HH:mm") : "N/A",
        s.endTime?.toDate ? format(s.endTime.toDate(), "yyyy-MM-dd HH:mm") : "N/A",
        s.duration || 0
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NEU_LabTrack_Report_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
    toast({ title: "Report Exported", description: `Exported ${filteredData.length} records.` });
  };

  if (sessionsLoading || roomsLoading || usersLoading || !mounted) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Audit & Analytics</p>
          <h1 className="text-3xl font-extrabold text-slate-800 leading-none">Institutional Reports</h1>
          <p className="text-sm text-slate-400 font-medium mt-2">Generate and export laboratory utilization data.</p>
        </div>
        <Button onClick={handleExportCSV} className="bg-primary hover:bg-primary/90 h-12 px-6 rounded-xl font-bold flex items-center gap-2">
          <FileDown size={20} /> Export CSV
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/20 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Search Faculty/Room</span>
              <Input 
                placeholder="Search..." 
                className="h-10 rounded-xl text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Room</span>
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map(r => <SelectItem key={r.id} value={r.number}>{r.number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">College</span>
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="All Colleges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">From</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 w-full rounded-xl text-[10px] px-2 justify-start truncate">
                      {format(dateRange.start, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateRange.start} onSelect={(d) => d && setDateRange(prev => ({...prev, start: d}))} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">To</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 w-full rounded-xl text-[10px] px-2 justify-start truncate">
                      {format(dateRange.end, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateRange.end} onSelect={(d) => d && setDateRange(prev => ({...prev, end: d}))} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty Member</TableHead>
                <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility</TableHead>
                <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program</TableHead>
                <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Start Time</TableHead>
                <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">End Time</TableHead>
                <TableHead className="px-8 h-14 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {filteredData.map((session) => {
                const profile = userMap[session.professorEmail?.toLowerCase()];
                return (
                  <TableRow key={session.id} className="hover:bg-slate-50/50 border-none">
                    <TableCell className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">
                          {profile?.name || session.professorEmail}
                        </span>
                        {profile?.name && (
                          <span className="text-[10px] text-slate-400">{session.professorEmail}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-4">
                      <Badge variant="outline" className="bg-slate-50 border-none font-bold text-[10px]">{session.roomNumber}</Badge>
                    </TableCell>
                    <TableCell className="px-8 py-4 text-xs font-medium text-slate-600">{session.program}</TableCell>
                    <TableCell className="px-8 py-4 text-right text-xs text-slate-400">
                      {session.startTime?.toDate ? format(session.startTime.toDate(), "MMM dd, hh:mm a") : "---"}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-right text-xs text-slate-400">
                      {session.endTime?.toDate ? format(session.endTime.toDate(), "MMM dd, hh:mm a") : "---"}
                    </TableCell>
                    <TableCell className="px-8 py-4 text-center font-bold text-primary">{session.duration || 0}m</TableCell>
                  </TableRow>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-400 italic font-medium">
                    No utilization records match the current filters.
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
