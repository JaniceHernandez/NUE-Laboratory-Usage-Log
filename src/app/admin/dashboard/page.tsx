
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  LineChart, Line, 
  ResponsiveContainer, Tooltip, Legend 
} from "recharts";
import { Clock, Monitor, Users, Activity, Loader2, MapPin, TrendingUp, BarChart3, PieChart as PieChartIcon, ShieldCheck } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, subDays, isAfter, eachDayOfInterval } from "date-fns";

export default function DashboardPage() {
  const db = useFirestore();

  const { data: sessions, loading: sessionsLoading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "sessions"), orderBy("startTime", "desc")) : null, [db])
  );
  const { data: rooms, loading: roomsLoading } = useCollection<any>(
    useMemo(() => db ? collection(db, "rooms") : null, [db])
  );

  const analytics = useMemo(() => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const activeSessionsCount = sessions.filter(s => s.status === 'active').length;
    const occupiedRoomsCount = rooms.filter(r => r.currentlyOccupied).length;
    
    const roomCounts: Record<string, number> = {};
    sessions.forEach(s => {
      roomCounts[s.roomNumber] = (roomCounts[s.roomNumber] || 0) + 1;
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
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    const dayCounts: Record<string, number> = {};
    last7Days.forEach(day => {
      dayCounts[format(day, "MMM dd")] = 0;
    });

    sessions.forEach(s => {
      const date = s.startTime?.toDate();
      if (date && isAfter(date, subDays(new Date(), 7))) {
        const dayKey = format(date, "MMM dd");
        if (dayCounts[dayKey] !== undefined) {
          dayCounts[dayKey]++;
        }
      }
    });

    return Object.entries(dayCounts).map(([name, sessions]) => ({ name, sessions }));
  }, [sessions]);

  const collegeData = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.college) {
        counts[s.college] = (counts[s.college] || 0) + 1;
      }
    });
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [sessions]);

  const activeSessionsList = useMemo(() => {
    return sessions.filter(s => s.status === 'active').slice(0, 5).map(s => ({
      professor: s.professorEmail || "Unknown",
      room: s.roomNumber || "N/A",
      time: s.startTime?.toDate ? format(s.startTime.toDate(), "hh:mm a") : "---",
      initials: (s.professorEmail || "??").substring(0, 2).toUpperCase()
    }));
  }, [sessions]);

  if (sessionsLoading || roomsLoading) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analytics.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm rounded-2xl bg-white group hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <Badge variant="outline" className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border-none">
                  {stat.trend}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} />
              System Utilization
            </CardTitle>
            <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-bold border-none">Weekly Trends</Badge>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'white', strokeWidth: 2, stroke: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="text-blue-500" size={20} />
              Active Facilities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {rooms.filter(r => r.currentlyOccupied).map((room, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{room.number}</p>
                      <p className="text-[10px] text-slate-400">{room.location}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-600 border-none font-bold text-[9px]">IN USE</Badge>
                </div>
              ))}
              {rooms.filter(r => r.currentlyOccupied).length === 0 && (
                <div className="p-12 text-center text-slate-400 text-sm italic">All facilities currently idle.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChartIcon className="text-orange-500" size={20} />
              Academic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={collegeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                  {collegeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="text-primary" size={20} />
              Current Check-ins
            </CardTitle>
            <Badge variant="outline" className="text-[10px] text-slate-400">Live List</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {activeSessionsList.map((activity, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-xl shadow-sm bg-slate-100 border border-slate-200">
                      <AvatarFallback className="rounded-xl text-[10px] font-bold text-slate-500">
                        {activity.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{activity.professor}</p>
                      <p className="text-[10px] text-slate-400">Started at {activity.time}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold border-none px-2.5 py-1 bg-primary/10 text-primary">
                    {activity.room}
                  </Badge>
                </div>
              ))}
              {activeSessionsList.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-sm italic">No active sessions found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
