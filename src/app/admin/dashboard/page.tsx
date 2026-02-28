
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  LineChart, Line, 
  ResponsiveContainer, Tooltip, Legend 
} from "recharts";
import { Clock, Monitor, Users, Activity, Loader2, MapPin, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, subDays, startOfDay, isAfter, eachDayOfInterval } from "date-fns";

export default function DashboardPage() {
  const db = useFirestore();

  // Real-time data streams
  const { data: sessions, loading: sessionsLoading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "sessions"), orderBy("startTime", "desc")) : null, [db])
  );
  const { data: rooms, loading: roomsLoading } = useCollection<any>(
    useMemo(() => db ? collection(db, "rooms") : null, [db])
  );

  // Advanced Analytics Stat Cards
  const analytics = useMemo(() => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const activeSessionsCount = sessions.filter(s => s.status === 'active').length;
    
    // Find most used room
    const roomCounts: Record<string, number> = {};
    sessions.forEach(s => {
      roomCounts[s.roomNumber] = (roomCounts[s.roomNumber] || 0) + 1;
    });
    const mostUsedRoomEntry = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0];
    const mostUsedRoom = mostUsedRoomEntry ? mostUsedRoomEntry[0] : "N/A";

    return [
      { title: "Total Logs", value: totalSessions, icon: Monitor, trend: "Overall", color: "text-blue-500", bgColor: "bg-blue-50" },
      { title: "Usage Hours", value: `${(totalMinutes / 60).toFixed(1)}h`, icon: Clock, trend: "Cumulative", color: "text-orange-500", bgColor: "bg-orange-50" },
      { title: "Busiest Lab", value: mostUsedRoom, icon: MapPin, trend: "Popularity", color: "text-green-500", bgColor: "bg-green-50" },
      { title: "Live Sessions", value: activeSessionsCount, icon: Activity, trend: "Real-time", color: "text-primary", bgColor: "bg-primary/5" },
    ];
  }, [sessions]);

  // Usage Trends (Line Chart) - Last 7 Days
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

  // Most Used Rooms (Bar Chart)
  const roomUsageData = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach(s => {
      counts[s.roomNumber] = (counts[s.roomNumber] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [sessions]);

  // College Distribution (Pie Chart)
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

  const recentActivity = useMemo(() => {
    return sessions.slice(0, 5).map(s => ({
      professor: s.professorEmail || "Unknown",
      room: s.roomNumber || "N/A",
      status: s.status,
      time: s.startTime?.toDate ? format(s.startTime.toDate(), "MMM dd, hh:mm a") : "---",
      initials: (s.professorEmail || "??").substring(0, 2).toUpperCase()
    }));
  }, [sessions]);

  if (sessionsLoading || roomsLoading) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <p className="text-sm font-medium text-slate-400">Aggregating system analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {analytics.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm rounded-2xl bg-white group hover:shadow-md transition-all duration-300 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} transition-colors duration-300`}>
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
        {/* Usage Trends Line Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} />
              Usage Frequency
            </CardTitle>
            <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-bold border-none">Last 7 Days</Badge>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'white', strokeWidth: 2, stroke: 'hsl(var(--primary))' }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Most Used Rooms Bar Chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="text-blue-500" size={20} />
              Top Facilities
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomUsageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]} 
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* College Distribution Pie Chart */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChartIcon className="text-orange-500" size={20} />
              College Participation
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
            {collegeData.length > 0 ? (
              <div className="flex flex-col md:flex-row h-full items-center">
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={collegeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {collegeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                No departmental data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live Activity Log */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Recent Utilization</CardTitle>
            <Badge variant="outline" className="text-[10px] font-bold text-slate-400">Latest 5 Logs</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentActivity.map((activity, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-10 w-10 rounded-xl shadow-sm bg-slate-100 border border-slate-200">
                      <AvatarFallback className="rounded-xl text-[10px] font-bold text-slate-500">
                        {activity.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-700 truncate">{activity.professor}</p>
                      <p className="text-[10px] text-slate-400">{activity.time}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className={`text-[9px] font-bold border-none px-2.5 py-1 ${activity.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {activity.room}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-sm italic">No recorded activity for this period.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
