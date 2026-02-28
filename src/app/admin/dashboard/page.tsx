
"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Clock, Monitor, Users, Activity, Loader2, MapPin } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function DashboardPage() {
  const db = useFirestore();

  // Fetch real data
  const { data: sessions, loading: sessionsLoading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "sessions"), orderBy("startTime", "desc")) : null, [db])
  );
  const { data: professors, loading: profsLoading } = useCollection<any>(
    useMemo(() => db ? query(collection(db, "users"), where("role", "==", "professor")) : null, [db])
  );
  const { data: rooms, loading: roomsLoading } = useCollection<any>(
    useMemo(() => db ? collection(db, "rooms") : null, [db])
  );

  // Derived Stats
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    
    // Find most used room
    const roomCounts: Record<string, number> = {};
    sessions.forEach(s => {
      roomCounts[s.roomNumber] = (roomCounts[s.roomNumber] || 0) + 1;
    });
    const mostUsedRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return [
      { title: "Total Logs", value: totalSessions, icon: Monitor, trend: "Live", color: "text-blue-500", bgColor: "bg-blue-50" },
      { title: "Total Hours", value: `${(totalMinutes / 60).toFixed(1)}h`, icon: Clock, trend: "Total", color: "text-orange-500", bgColor: "bg-orange-50" },
      { title: "Most Used Room", value: mostUsedRoom, icon: MapPin, trend: "Rank 1", color: "text-green-500", bgColor: "bg-green-50" },
      { title: "Active Sessions", value: activeSessions, icon: Activity, trend: "Now", color: "text-primary", bgColor: "bg-primary/5" },
    ];
  }, [sessions]);

  // Chart Data (Mocking structure but using session counts)
  const pieData = useMemo(() => {
    const collegeCounts: Record<string, number> = {};
    sessions.forEach(s => {
      collegeCounts[s.college] = (collegeCounts[s.college] || 0) + 1;
    });
    return Object.entries(collegeCounts).map(([name, value]) => ({
      name,
      value: Math.round((value / sessions.length) * 100),
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }));
  }, [sessions]);

  const recentActivity = useMemo(() => {
    return sessions.slice(0, 5).map(s => ({
      professor: s.professorEmail,
      room: s.roomNumber,
      action: s.status === 'active' ? 'CHECK-IN' : 'CHECK-OUT',
      time: s.startTime?.toDate ? format(s.startTime.toDate(), "MMM dd, hh:mm a") : "---",
      avatar: s.professorEmail.substring(0, 2).toUpperCase()
    }));
  }, [sessions]);

  if (sessionsLoading || profsLoading || roomsLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm rounded-2xl bg-white group hover:shadow-md transition-all duration-300 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} transition-colors duration-300`}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border-none">
                  {stat.trend}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                <p className="text-3xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Usage per College (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">No college data available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentActivity.map((activity, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-lg shadow-sm">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-[10px] font-bold">{activity.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{activity.professor}</p>
                      <p className="text-[10px] text-slate-400">{activity.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`text-[9px] font-bold border-none ${activity.action === 'CHECK-IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {activity.room}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="p-6 text-center text-slate-400">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
