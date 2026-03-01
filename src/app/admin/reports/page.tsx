"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileDown, 
  Calendar as CalendarIcon, 
  Filter, 
  Loader2, 
  BarChart, 
  Clock, 
  Users, 
  Database,
  ArrowRight,
  Search,
  X
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function ReportsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  const { data: sessions, loading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "sessions"), orderBy("startTime", "desc")) : null, [db])
  );

  const filteredData = useMemo(() => {
    return sessions.filter((s: any) => {
      const date = s.startTime?.toDate();
      const matchesDate = date ? isWithinInterval(date, {
        start: startOfDay(dateRange.start),
        end: endOfDay(dateRange.end)
      }) : false;

      const matchesSearch = 
        s.professorEmail?.toLowerCase().includes(search.toLowerCase()) ||
        s.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.college?.toLowerCase().includes(search.toLowerCase()) ||
        s.program?.toLowerCase().includes(search.toLowerCase());

      return matchesDate && matchesSearch;
    });
  }, [sessions, dateRange, search]);

  const reportStats = useMemo(() => {
    const totalSessions = filteredData.length;
    const totalMinutes = filteredData.reduce((acc, s) => acc + (s.duration || 0), 0);
    const uniqueProfessors = new Set(filteredData.map(s => s.professorEmail)).size;
    const uniqueRooms = new Set(filteredData.map(s => s.roomNumber)).size;

    return {
      sessions: totalSessions,
      hours: (totalMinutes / 60).toFixed(1),
      professors: uniqueProfessors,
      rooms: uniqueRooms
    };
  }, [filteredData]);

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

  if (loading) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
          { label: "Total Usage", value: `${reportStats.hours}h`, icon: Clock, color: "text-orange-500", bgColor: "bg-orange-50" },
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
        <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Consolidated Log Explorer</CardTitle>
              <CardDescription>Detailed session records for the active date range and filter.</CardDescription>
            </div>
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
              <Input 
                placeholder="Search by faculty, room, or program..." 
                className="pl-12 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                {filteredData.slice(0, 20).map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{session.professorEmail?.split('@')[0]}</span>
                        <span className="text-[10px] text-slate-400">{session.professorEmail}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-none font-bold text-[10px]">
                        {session.roomNumber}
                      </Badge>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600">{session.program}</span>
                        <span className="text-[10px] text-slate-400">({session.college})</span>
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
                ))}
                {filteredData.length > 20 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-6 text-center bg-slate-50/30">
                      <p className="text-xs text-slate-400 italic">Showing top 20 records. Use "Export CSV" for the full dataset.</p>
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
