
"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  LineChart, Line, 
  ResponsiveContainer, Tooltip, Legend 
} from "recharts";
import { 
  Clock, Monitor, Activity, MapPin, 
  TrendingUp, BarChart3, PieChart as PieChartIcon, 
  History, ArrowRight, Loader2
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  format, subDays, eachDayOfInterval, 
  isSameDay, isSameWeek, isSameMonth, subWeeks, subMonths, eachWeekOfInterval, eachMonthOfInterval
} from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { cn } from "@/lib/utils";

const COLLEGE_MAP: Record<string, string> = {
  "College of Informatics and Computing Studies": "College of Informatics and Computing Studies (CICS)",
  "College of Engineering and Architecture": "College of Engineering and Architecture (CEA)",
  "College of Communication": "College of Communication (COC)",
  "College of Accountancy": "College of Accountancy (CA)",
  "CICS": "College of Informatics and Computing Studies (CICS)",
  "CEA": "College of Engineering and Architecture (CEA)",
  "COC": "College of Communication (COC)",
  "CA": "College of Accountancy (CA)"
};

export default function DashboardPage() {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [trendGranularity, setTrendGranularity] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: sessions, loading: sessionsLoading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "sessions"), orderBy("startTime", "desc")) : null, [db])
  );
  const { data: rooms, loading: roomsLoading } = useCollection<any>(
    useMemo(() => db ? collection(db, "rooms") : null, [db])
  );
  const { data: users, loading: usersLoading } = useCollection<any>(
    useMemo(() => db ? collection(db, "users") : null, [db])
  );

  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => {
      if (u.email) map[u.email] = u.name || u.email;
    });
    return map;
  }, [users]);

  const analytics = useMemo(() => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const occupiedRoomsCount = rooms.filter(r => r.currentlyOccupied).length;
    
    const roomCounts: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.roomNumber) {
        roomCounts[s.roomNumber] = (roomCounts[s.roomNumber] || 0) + 1;
      }
    });
    const mostUsedRoomEntry = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0];
    const mostUsedRoom = mostUsedRoomEntry ? mostUsedRoomEntry[0] : "N/A";

    return [
      { title: "Total Logs", value: totalSessions, icon: Monitor, trend: "Cumulative", color: "text-blue-500", bgColor: "bg-blue-50" },
      { title: "Usage Minutes", value: `${totalMinutes}m`, icon: Clock, trend: "Overall", color: "text-orange-500", bgColor: "bg-orange-50" },
      { title: "Busiest Lab", value: mostUsedRoom, icon: MapPin, trend: "Most Active", color: "text-green-500", bgColor: "bg-green-50" },
      { title: "Live Units", value: `${occupiedRoomsCount}/${rooms.length}`, icon: Activity, trend: "Real-time", color: "text-[#266AFF]", bgColor: "bg-blue-50" },
    ];
  }, [sessions, rooms]);

  const trendData = useMemo(() => {
    if (!mounted) return [];
    const now = new Date();
    let intervals: Date[] = [];
    let formatStr = "MMM dd";
    
    if (trendGranularity === "daily") {
      intervals = eachDayOfInterval({ start: subDays(now, 6), end: now });
      formatStr = "MMM dd";
    } else if (trendGranularity === "weekly") {
      intervals = eachWeekOfInterval({ start: subWeeks(now, 4), end: now });
      formatStr = "MMM dd";
    } else if (trendGranularity === "monthly") {
      intervals = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
      formatStr = "MMM yyyy";
    }

    return intervals.map(date => {
      const count = sessions.filter(s => {
        const sDate = s.startTime?.toDate();
        if (!sDate) return false;
        if (trendGranularity === "daily") return isSameDay(sDate, date);
        if (trendGranularity === "weekly") return isSameWeek(sDate, date);
        if (trendGranularity === "monthly") return isSameMonth(sDate, date);
        return false;
      }).length;

      return {
        name: format(date, formatStr),
        sessions: count
      };
    });
  }, [sessions, trendGranularity, mounted]);

  const collegeData = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.college) {
        const fullLabel = COLLEGE_MAP[s.college] || s.college;
        counts[fullLabel] = (counts[fullLabel] || 0) + 1;
      }
    });
    
    const colors = ['#266AFF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [sessions]);

  const roomUsageData = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.roomNumber) {
        counts[s.roomNumber] = (counts[s.roomNumber] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [sessions]);

  const recentActivityList = useMemo(() => {
    if (!mounted) return [];
    const events: any[] = [];
    
    sessions.forEach(s => {
      const profName = userMap[s.professorEmail] || s.professorEmail || "Unknown";
      
      if (s.startTime?.toDate) {
        events.push({
          professor: profName,
          room: s.roomNumber || "N/A",
          rawTime: s.startTime.toDate(),
          action: 'Check-in',
          initials: profName.substring(0, 2).toUpperCase()
        });
      }
      
      if (s.status === 'completed' && s.endTime?.toDate) {
        events.push({
          professor: profName,
          room: s.roomNumber || "N/A",
          rawTime: s.endTime.toDate(),
          action: 'Check-out',
          initials: profName.substring(0, 2).toUpperCase()
        });
      }
    });

    return events
      .sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime())
      .slice(0, 5)
      .map(e => ({
        ...e,
        time: format(e.rawTime, "MMM dd, hh:mm a")
      }));
  }, [sessions, userMap, mounted]);

  if (sessionsLoading || roomsLoading || usersLoading || !mounted) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm rounded-xl bg-white group hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <stat.icon size={18} strokeWidth={2.5} />
                </div>
                <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0 rounded-full bg-slate-50 text-slate-400 border-none">
                  {stat.trend}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                <p className="text-xl font-extrabold text-slate-800 tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="text-[#266AFF]" size={16} />
              Utilization Trends
            </CardTitle>
            <div className="flex bg-slate-50 p-1 rounded-lg">
              {["daily", "weekly", "monthly"].map((g) => (
                <button
                  key={g}
                  onClick={() => setTrendGranularity(g as any)}
                  className={cn(
                    "px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all",
                    trendGranularity === g ? "bg-white text-[#266AFF] shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[220px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', fontSize: '10px' }}
                />
                <Line type="monotone" dataKey="sessions" stroke="#266AFF" strokeWidth={2.5} dot={{ r: 2, fill: 'white', strokeWidth: 1.5, stroke: '#266AFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="text-blue-500" size={16} />
              Active Facilities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 max-h-[220px] overflow-y-auto">
              {rooms.filter(r => r.currentlyOccupied).map((room, i) => (
                <div key={i} className="px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-50 text-blue-500 rounded flex items-center justify-center">
                      <MapPin size={12} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-700">{room.number}</p>
                      <p className="text-[8px] text-slate-400">{room.location}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-600 border-none font-bold text-[7px] px-1.5 py-0">IN USE</Badge>
                </div>
              ))}
              {rooms.filter(r => r.currentlyOccupied).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-[10px] italic">All facilities currently idle.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="text-purple-500" size={16} />
              Most Used Facilities
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomUsageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={60} tick={{ fill: '#64748b', fontSize: 8, fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '10px' }} />
                <Bar dataKey="value" fill="#266AFF" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
          <CardHeader className="p-4 border-b border-slate-50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChartIcon className="text-orange-500" size={16} />
              Usage by College
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={collegeData} 
                  cx="35%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                >
                  {collegeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Legend 
                  iconType="circle" 
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ 
                    paddingLeft: '20px', 
                    fontSize: '10px', 
                    fontWeight: '700',
                    width: '55%'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="text-[#266AFF]" size={16} />
            Recent Activity
          </CardTitle>
          <Link href="/admin/reports" className="text-[9px] font-bold text-[#266AFF] hover:underline flex items-center gap-1">
            View All <ArrowRight size={10} />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="px-4 h-8 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Professor</TableHead>
                <TableHead className="px-4 h-8 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Facility</TableHead>
                <TableHead className="px-4 h-8 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</TableHead>
                <TableHead className="px-4 h-8 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivityList.map((activity, i) => (
                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 rounded bg-slate-100 border border-slate-200">
                        <AvatarFallback className="rounded text-[8px] font-bold text-slate-500">
                          {activity.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-bold text-slate-700">{activity.professor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <Badge variant="outline" className="bg-[#266AFF]/5 text-[#266AFF] border-none font-bold text-[8px] px-1.5 py-0">
                      {activity.room}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-center">
                    <Badge className={`text-[7px] font-bold px-1.5 py-0 rounded-full ${activity.action === 'Check-in' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                      {activity.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right">
                    <span className="text-[9px] font-medium text-slate-400">{activity.time}</span>
                  </TableCell>
                </TableRow>
              ))}
              {recentActivityList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-slate-400 text-[10px] italic">
                    No recent activity found.
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
