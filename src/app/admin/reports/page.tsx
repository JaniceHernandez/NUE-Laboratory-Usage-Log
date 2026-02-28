
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
  ArrowRight
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  const { data: sessions, loading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "sessions"), orderBy("startTime", "desc")) : null, [db])
  );

  const filteredData = useMemo(() => {
    return sessions.filter((s: any) => {
      const date = s.startTime?.toDate();
      if (!date) return false;
      return isWithinInterval(date, {
        start: startOfDay(dateRange.start),
        end: endOfDay(dateRange.end)
      });
    });
  }, [sessions, dateRange]);

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
        description: "No logs found for the selected date range."
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
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Analytics</p>
          <h1 className="text-3xl font-extrabold text-slate-800 leading-none">System Reports</h1>
          <p className="text-sm text-slate-400 font-medium mt-2">Generate and export institutional usage analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-100 rounded-xl px-4 py-2 gap-3 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-slate-400">Date Range</span>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>{format(dateRange.start, "MMM dd")}</span>
                <ArrowRight size={12} className="text-slate-300" />
                <span>{format(dateRange.end, "MMM dd")}</span>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary rounded-lg">
              <Filter size={16} />
            </Button>
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
          { label: "Range Logs", value: reportStats.sessions, icon: Database, color: "text-blue-500", bgColor: "bg-blue-50" },
          { label: "Active Faculty", value: reportStats.professors, icon: Users, color: "text-green-500", bgColor: "bg-green-50" },
          { label: "Total Usage", value: `${reportStats.hours}h`, icon: Clock, color: "text-orange-500", bgColor: "bg-orange-50" },
          { label: "Facilities Used", value: reportStats.rooms, icon: BarChart, color: "text-purple-500", bgColor: "bg-purple-50" },
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-bold">Consolidated Usage Data</CardTitle>
              <CardDescription>Detailed session records for the selected period.</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-bold border-none px-3 py-1">
              {filteredData.length} Records Found
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty Member</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Facility</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Duration</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.slice(0, 15).map((session) => (
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
                        {session.startTime?.toDate ? format(session.startTime.toDate(), "MMM dd, yyyy") : "---"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredData.length > 15 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-6 text-center bg-slate-50/30">
                      <p className="text-xs text-slate-400 italic">Showing top 15 records. Use Export for the full dataset.</p>
                    </td>
                  </tr>
                )}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                      No matching records found for the selected timeframe.
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
