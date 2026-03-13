"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  LineChart, Line, 
  ResponsiveContainer, Tooltip, Legend 
} from "recharts";
import { 
  Clock, Monitor, Users, Activity, Loader2, MapPin, 
  TrendingUp, BarChart3, PieChart as PieChartIcon, 
  History, Calendar, ArrowRight
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  format, subDays, isAfter, eachDayOfInterval, 
  startOfDay, endOfDay, subWeeks, subMonths,
  eachWeekOfInterval, eachMonthOfInterval, isSameDay,
  isSameWeek, isSameMonth
} from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

const COLLEGE_MAP: Record<string, string> = {
  "CICS": "Informatics & Computing Studies",
  "CEA": "Engineering & Architecture",
  "COC": "College of Communication",
  "CA": "College of Accountancy"
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
      { title: "Usage Hours", value: `${(totalMinutes / 60).toFixed(1)}h`, icon: Clock, trend: "Overall", color: "text-orange-500", bgColor: "bg-orange-50" },
      { title: "Busiest Lab", value: mostUsedRoom, icon: MapPin, trend: "Most Active", color: "text-green-500", bgColor: "bg-green-50" },
      { title: "Live Units", value: `${occupiedRoomsCount}/${rooms.length}`, icon: Activity, trend: "Real-time", color: "text-primary", bgColor: "bg-primary/5" },
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
        const fullName = COLLEGE_MAP[s.college] || s.college;
        counts[fullName] = (counts[fullName] || 0) + 1;
      }
    });
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
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
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm rounded-2xl bg-white group hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${stat.bgColor} ${stat.color}`}>
                  <stat.icon size={20} strokeWidth={2.5} />
                </div>
                <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0 rounded-full bg-slate-50 text-slate-400 border-none">
                  {stat.trend}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-50 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="text-primary" size={18} />
                Utilization Trends
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={trendGranularity} onValueChange={(v: any) => setTrendGranularity(v)}>
                <SelectTrigger className="w-[100px] h-8 bg-slate-50 border-none rounded-lg text-[10px] font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] p-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3, fill: 'white', strokeWidth: 2, stroke: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-50">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="text-blue-500" size={18} />
              Active Facilities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {rooms.filter(r => r.currentlyOccupied).map((room, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                      <MapPin size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{room.number}</p>
                      <p className="text-[9px] text-slate-400">{room.location}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-600 border-none font-bold text-[8px]">IN USE</Badge>
                </div>
              ))}
              {rooms.filter(r => r.currentlyOccupied).length === 0 && (
                <div className="p-10 text-center text-slate-400 text-xs italic">All facilities currently idle.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-50">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="text-purple-500" size={18} />
              Most Used Facilities
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomUsageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-5 border-b border-slate-50">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PieChartIcon className="text-orange-500" size={18} />
              Usage by College
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={collegeData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                  {collegeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value, name) => [value, name]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-5 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="text-primary" size={18} />
            Recent Activity
          </CardTitle>
          <Link href="/admin/logs" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="px-5 h-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Professor</TableHead>
                <TableHead className="px-5 h-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Facility</TableHead>
                <TableHead className="px-5 h-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</TableHead>
                <TableHead className="px-5 h-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivityList.map((activity, i) => (
                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200">
                        <AvatarFallback className="rounded-lg text-[9px] font-bold text-slate-500">
                          {activity.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-slate-700">{activity.professor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-center">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-none font-bold text-[9px]">
                      {activity.room}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-center">
                    <Badge className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${activity.action === 'Check-in' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                      {activity.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-right">
                    <span className="text-[10px] font-medium text-slate-400">{activity.time}</span>
                  </TableCell>
                </TableRow>
              ))}
              {recentActivityList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-400 text-xs italic">
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