"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Clock, Monitor, Users, Activity, Loader2, MapPin, TrendingUp } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function DashboardPage() {
  const db = useFirestore();

  // Real-time data streams
  const { data: sessions, loading: sessionsLoading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "sessions"), orderBy("startTime", "desc")) : null, [db])
  );
  const { data: professors, loading: profsLoading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "users"), where("role", "==", "professor")) : null, [db])
  );
  const { data: rooms, loading: roomsLoading } = useCollection<any>(
    useMemo(() => db ? collection(db, "rooms") : null, [db])
  );

  // Advanced Analytics
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

  // College distribution chart data
  const chartData = useMemo(() => {
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
    return sessions.slice(0, 6).map(s => ({
      professor: s.professorEmail || "Unknown",
      room: s.roomNumber || "N/A",
      status: s.status,
      time: s.startTime?.toDate ? format(s.startTime.toDate(), "MMM dd, hh:mm a") : "---",
      initials: (s.professorEmail || "??").substring(0, 2).toUpperCase()
    }));
  }, [sessions]);

  if (sessionsLoading || profsLoading || roomsLoading) {
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
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} />
              College Participation
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] p-6">
            {chartData.length > 0 ? (
              <div className="flex flex-col md:flex-row h-full items-center">
                <div className="flex-1 w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-48 space-y-3 mt-6 md:mt-0">
                  {chartData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-slate-400">{item.value} logs</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Insufficient data to generate college metrics.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-50">
            <CardTitle className="text-lg font-bold">Live Activity Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentActivity.map((activity, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-10 w-10 rounded-xl shadow-sm bg-slate-100">
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
                <div className="p-12 text-center text-slate-400 text-sm">No recorded activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
