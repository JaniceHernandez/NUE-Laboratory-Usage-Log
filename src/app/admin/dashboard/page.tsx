"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, 
  LineChart, Line, 
  BarChart, Bar,
  ResponsiveContainer, Tooltip,
  CartesianGrid, XAxis, YAxis
} from "recharts";
import { 
  Clock, Monitor, Activity, MapPin, 
  TrendingUp, PieChart as PieChartIcon, 
  History, ArrowRight, Loader2,
  BarChart3, Layout
} from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  format, subDays, eachDayOfInterval, 
  isSameDay, isSameWeek, isSameMonth, subWeeks, subMonths, eachWeekOfInterval, eachMonthOfInterval
} from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { cn } from "@/lib/utils";

const COLLEGES = [
  "College of Informatics and Computing Studies",
  "College of Engineering and Architecture",
  "College of Communication",
  "College of Accountancy"
];

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
      if (u.email) map[u.email.toLowerCase()] = u.name || u.email;
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
        const sDate = s.startTime?.toDate ? s.startTime.toDate() : (s.startTime instanceof Date ? s.startTime : null);
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
        const trimmed = s.college.trim();
        counts[trimmed] = (counts[trimmed] || 0) + 1;
      }
    });
    
    const colors = ['#266AFF', '#4BC64F', '#FFD43D', '#ef4444', '#8b5cf6'];
    return COLLEGES.map((name, idx) => ({
      name,
      value: counts[name] || 0,
      color: colors[idx % colors.length]
    }));
  }, [sessions]);

  const mostUsedFacilitiesData = useMemo(() => {
    const roomCounts: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.roomNumber) {
        roomCounts[s.roomNumber] = (roomCounts[s.roomNumber] || 0) + 1;
      }
    });
    return Object.entries(roomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [sessions]);

  const activeRooms = useMemo(() => {
    return rooms.filter(r => r.currentlyOccupied);
  }, [rooms]);

  const recentActivityList = useMemo(() => {
    if (!mounted) return [];
    const events: any[] = [];
    
    sessions.forEach(s => {
      const email = s.professorEmail?.toLowerCase();
      const profName = email ? (userMap[email] || s.professorEmail) : "Unknown";
      
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
          <Card key={stat.title} className="border-none shadow-sm rounded-xl bg-white group hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0 border-none bg-slate-50">
                  {stat.trend}
                </Badge>
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
              <p className="text-xl font-extrabold text-slate-800 tracking-tight">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Facilities Card */}
        <Card className="border-none shadow-sm rounded-xl bg-white">
          <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center gap-2">
            <Activity className="text-[#266AFF]" size={16} />
            <CardTitle className="text-sm font-bold">Active Facilities</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center p-4">
            {activeRooms.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-3">
                {activeRooms.map(room => (
                  <Badge key={room.id} className="bg-green-100 text-green-600 border-none font-bold text-xs px-4 py-2 rounded-lg">
                    {room.number}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic font-medium">All facilities currently idle.</p>
            )}
          </CardContent>
        </Card>

        {/* Utilization Trends */}
        <Card className="border-none shadow-sm rounded-xl bg-white">
          <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="text-[#266AFF]" size={16} /> Utilization Trends
            </CardTitle>
            <div className="flex bg-slate-50 p-1 rounded-lg gap-1">
              {["daily", "weekly", "monthly"].map((g) => (
                <button
                  key={g}
                  onClick={() => setTrendGranularity(g as any)}
                  className={cn(
                    "px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all",
                    trendGranularity === g ? "bg-white text-[#266AFF] shadow-sm" : "text-slate-400"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[250px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '10px' }} />
                <Line type="monotone" dataKey="sessions" stroke="#266AFF" strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Facilities Card - Horizontal Bar Chart */}
        <Card className="border-none shadow-sm rounded-xl bg-white">
          <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center gap-2">
            <BarChart3 className="text-[#266AFF]" size={16} />
            <CardTitle className="text-sm font-bold">Most Used Facilities</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={mostUsedFacilitiesData} 
                layout="vertical"
                margin={{ left: 20, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                  width={60}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '10px' }} 
                />
                <Bar dataKey="value" fill="#266AFF" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage by College */}
        <Card className="border-none shadow-sm rounded-xl bg-white">
          <CardHeader className="p-4 border-b border-slate-50">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChartIcon className="text-orange-500" size={16} /> Usage by College
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex items-center h-[250px] gap-4">
            <div className="w-2/5 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={collegeData.filter(d => d.value > 0)} 
                    innerRadius={45} 
                    outerRadius={65} 
                    paddingAngle={5} 
                    dataKey="value"
                    stroke="none"
                  >
                    {collegeData.filter(d => d.value > 0).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-3/5 space-y-2.5 pl-2 overflow-y-auto max-h-full">
              {collegeData.map((entry, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: entry.color }} />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-700 leading-tight uppercase tracking-tight">{entry.name}</span>
                    <span className="text-[8px] text-slate-400 font-medium">{entry.value} Logs</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-xl bg-white overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="text-[#266AFF]" size={16} /> Recent Activity
          </CardTitle>
          <Link href="/admin/reports" className="text-[9px] font-bold text-[#266AFF] hover:underline flex items-center gap-1">
            View All <ArrowRight size={10} />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none">
                <TableHead className="px-6 h-8 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Professor</TableHead>
                <TableHead className="px-6 h-8 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Facility</TableHead>
                <TableHead className="px-6 h-8 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</TableHead>
                <TableHead className="px-6 h-8 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivityList.map((activity, i) => (
                <TableRow key={i} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="px-6 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 rounded bg-slate-100 border border-slate-200">
                        <AvatarFallback className="text-[8px] font-bold text-slate-500">{activity.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] font-bold text-slate-700">{activity.professor}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-2 text-center">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-none text-[8px] px-1.5 py-0 font-bold">
                      {activity.room}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-2 text-center">
                    <Badge className={`text-[7px] font-bold px-1.5 py-0 ${activity.action === 'Check-in' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                      {activity.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-2 text-right">
                    <span className="text-[9px] font-medium text-slate-400">{activity.time}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
