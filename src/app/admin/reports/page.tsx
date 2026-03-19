"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileDown, 
  Loader2, 
  BarChart, 
  Clock, 
  Users, 
  Database,
  ArrowRight,
  Search,
  FilterX
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

const COLLEGES = [
  "College of Informatics and Computing Studies (CICS)",
  "College of Engineering and Architecture (CEA)",
  "College of Communication (COC)",
  "College of Accountancy (CA)",
];

const PROGRAMS: Record<string, string[]> = {
  "College of Informatics and Computing Studies (CICS)": [
    "Bachelor of Library and Information Science",
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Digital Animation Technology",
    "Bachelor of Science in Entertainment and Multimedia Computing with Specialization in Game Development",
    "Bachelor of Science in Information Technology",
    "Bachelor of Science in Information System"
  ],
  "College of Engineering and Architecture (CEA)": [
    "Bachelor of Science in Architecture",
    "Bachelor of Science in Astronomy",
    "Bachelor of Science in Civil Engineering",
    "Bachelor of Science in Electrical Engineering",
    "Bachelor of Science in Electronics Engineering",
    "Bachelor of Science in Industrial Engineering",
    "Bachelor of Science in Mechanical Engineering"
  ],
  "College of Communication (COC)": [
    "Bachelor of Arts in Broadcasting",
    "Bachelor of Arts in Communication",
    "Bachelor of Arts in Journalism"
  ],
  "College of Accountancy (CA)": [
    "Bachelor of Science in Accounting Information System"
  ]
};

export default function ReportsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
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
    const map: Record<string, string> = {};
    users.forEach(u => {
      if (u.email && u.name) map[u.email.toLowerCase()] = u.name;
    });
    return map;
  }, [users]);

  const filteredData = useMemo(() => {
    if (!mounted) return [];
    return sessions.filter((s: any) => {
      // Date Filter
      const date = s.startTime?.toDate ? s.startTime.toDate() : (s.startTime instanceof Date ? s.startTime : null);
      const matchesDate = date ? isWithinInterval(date, {
        start: startOfDay(dateRange.start),
        end: endOfDay(dateRange.end)
      }) : false;

      // Global Search Filter
      const matchesSearch = 
        !search || 
        s.professorEmail?.toLowerCase().includes(search.toLowerCase()) ||
        s.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.college?.toLowerCase().includes(search.toLowerCase()) ||
        s.program?.toLowerCase().includes(search.toLowerCase());

      // Specific Filters
      const matchesRoom = roomFilter === "all" || s.roomNumber === roomFilter;
      const matchesCollege = collegeFilter === "all" || s.college === collegeFilter;
      const matchesProgram = programFilter === "all" || s.program === programFilter;

      return matchesDate && matchesSearch && matchesRoom && matchesCollege && matchesProgram;
    });
  }, [sessions, dateRange, search, roomFilter, collegeFilter, programFilter, mounted]);

  const reportStats = useMemo(() => {
    const totalSessions = filteredData.length;
    const totalMinutes = filteredData.reduce((acc, s) => acc + (s.duration || 0), 0);
    const uniqueProfessors = new Set(filteredData.map(s => s.professorEmail)).size;
    const uniqueRooms = new Set(filteredData.map(s => s.roomNumber)).size;

    return {
      sessions: totalSessions,
      minutes: totalMinutes,
      professors: uniqueProfessors,
      rooms: uniqueRooms
    };
  }, [filteredData]);

  const resetFilters = () => {
    setSearch("");
    setRoomFilter("all");
    setCollegeFilter("all");
    setProgramFilter("all");
    setDateRange({
      start: subDays(new Date(), 30),
      end: new Date()
    });
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "No logs found for the selected criteria."
      });
      return;
    }

    const headers = ["ID", "Professor", "Room", "College", "Program", "Section", "Start Time", "End Time", "Duration (Min)", "Status"];
    const rows = filteredData.map(s => [
      s.id,
      s.professorEmail,
      s.roomNumber,
      s.college,
      s.program,
      s.section,
      s.startTime?.toDate ? format(s.startTime.toDate(), "yyyy-MM-dd HH:mm:ss") : "N/A",
      s.endTime?.toDate ? format(s.endTime.toDate(), "yyyy-MM-dd HH:mm:ss") : "N/A",
      s.duration || 0,
      s.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `NEU_LabTrack_Report_${format(new Date(), "yyyyMMdd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredData.length} records to CSV.`
    });
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
          <p className="text-sm text-slate-400 font-medium mt-2">Generate, filter, and export laboratory utilization data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-100 rounded-xl px-4 py-2 gap-3 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400">Date Range Selection</span>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-6 p-0 text-xs font-bold text-slate-700 hover:bg-transparent">
                      {format(dateRange.start, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.start}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, start: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <ArrowRight size={12} className="text-slate-300" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-6 p-0 text-xs font-bold text-slate-700 hover:bg-transparent">
                      {format(dateRange.end, "MMM dd, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.end}
                      onSelect={(date) => date && setDateRange(prev => ({ ...prev, end: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleExportCSV}
            className="bg-primary hover:bg-primary/90 h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
          >
            <FileDown size={20} />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Filtered Logs", value: reportStats.sessions, icon: Database, color: "text-blue-500", bgColor: "bg-blue-50" },
          { label: "Faculty Involved", value: reportStats.professors, icon: Users, color: "text-green-500", bgColor: "bg-green-50" },
          { label: "Total Minutes", value: `${reportStats.minutes}m`, icon: Clock, color: "text-orange-500", bgColor: "bg-orange-50" },
          { label: "Rooms Utilized", value: reportStats.rooms, icon: BarChart, color: "text-purple-500", bgColor: "bg-purple-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon size={24} />
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-extrabold text-slate-800">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/20 space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Consolidated Log Explorer</CardTitle>
              <CardDescription>Detailed session records with advanced multi-criteria filtering.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 gap-2"
                onClick={resetFilters}
              >
                <FilterX size={14} /> Clear All Filters
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Global Search</span>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={14} />
                <Input 
                  placeholder="Professor, Room, etc..." 
                  className="pl-9 h-10 bg-white border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Room Number</span>
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className="h-10 bg-white border-slate-200 rounded-xl text-xs">
                  <SelectValue placeholder="All Rooms" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map(r => <SelectItem key={r.id} value={r.number}>{r.number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">College</span>
              <Select value={collegeFilter} onValueChange={(val) => { setCollegeFilter(val); setProgramFilter("all"); }}>
                <SelectTrigger className="h-10 bg-white border-slate-200 rounded-xl text-xs">
                  <SelectValue placeholder="All Colleges" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Colleges</SelectItem>
                  {COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Program</span>
              <Select value={programFilter} onValueChange={setProgramFilter} disabled={collegeFilter === "all"}>
                <SelectTrigger className="h-10 bg-white border-slate-200 rounded-xl text-xs">
                  <SelectValue placeholder={collegeFilter === "all" ? "Select College First" : "All Programs"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Programs</SelectItem>
                  {collegeFilter !== "all" && PROGRAMS[collegeFilter]?.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty Member</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program / College</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Duration</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Start Time</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">End Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.slice(0, 50).map((session) => {
                  const facultyEmail = session.professorEmail?.toLowerCase();
                  const facultyName = facultyEmail ? userMap[facultyEmail] : null;
                  
                  return (
                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          {facultyName ? (
                            <>
                              <span className="font-bold text-slate-700">{facultyName}</span>
                              <span className="text-[10px] text-slate-400">{session.professorEmail}</span>
                            </>
                          ) : (
                            <span className="font-bold text-slate-700">{session.professorEmail}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-none font-bold text-[10px]">
                          {session.roomNumber}
                        </Badge>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-600">{session.program}</span>
                          <span className="text-[10px] text-slate-400">{session.college}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-xs font-mono font-bold text-primary">{session.duration || 0}m</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="text-xs text-slate-400">
                          {session.startTime?.toDate ? format(session.startTime.toDate(), "MMM dd, hh:mm a") : "---"}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="text-xs text-slate-400">
                          {session.endTime?.toDate ? format(session.endTime.toDate(), "MMM dd, hh:mm a") : "---"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredData.length > 50 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-6 text-center bg-slate-50/30">
                      <p className="text-xs text-slate-400 italic">Showing top 50 records. Use "Export CSV" for the full dataset.</p>
                    </td>
                  </tr>
                )}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                      No matching records found for the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
