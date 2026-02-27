"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Clock, Monitor, Users, Activity, TrendingUp, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const stats = [
  { title: "Total Room Usage", value: "1,240", icon: Monitor, trend: "+12%", color: "text-blue-500", bgColor: "bg-blue-50" },
  { title: "Total Hours Used", value: "3,520h", icon: Clock, trend: "+8.4%", color: "text-orange-500", bgColor: "bg-orange-50" },
  { title: "Most Used Room", value: "Lab 402", icon: MapPin, trend: "Rank 1", color: "text-green-500", bgColor: "bg-green-50" },
  { title: "Active Sessions", value: "12", icon: Activity, trend: "Live", color: "text-primary", bgColor: "bg-primary/5" },
];

const trendData = [
  { name: "JAN", usage: 45 },
  { name: "FEB", usage: 52 },
  { name: "MAR", usage: 48 },
  { name: "APR", usage: 61 },
  { name: "MAY", usage: 55 },
  { name: "JUN", usage: 82 },
  { name: "JUL", usage: 75 },
];

const pieData = [
  { name: "Engineering", value: 42, color: "#2563EB" },
  { name: "Comp. Studies", value: 38, color: "#10B981" },
  { name: "Nursing", value: 20, color: "#F59E0B" },
];

const roomStats = [
  { name: "Lab 402", usage: 88, color: "bg-blue-600" },
  { name: "Lab 405", usage: 72, color: "bg-blue-500" },
  { name: "Lab 101", usage: 65, color: "bg-blue-400" },
  { name: "Lab 201", usage: 42, color: "bg-blue-300" },
];

const recentActivity = [
  { professor: "Dr. Juan Dela Cruz", room: "Lab 402", action: "CHECK-IN", time: "Oct 24, 2023 | 09:30 AM", avatar: "JD" },
  { professor: "Prof. Maria Santos", room: "Lab 201", action: "CHECK-OUT", time: "Oct 24, 2023 | 11:45 AM", avatar: "MS" },
  { professor: "Dr. Ricardo Bautista", room: "Lab 405", action: "CHECK-IN", time: "Oct 24, 2023 | 01:15 PM", avatar: "RB" },
  { professor: "Prof. Elena Luna", room: "Lab 101", action: "CHECK-IN", time: "Oct 24, 2023 | 02:30 PM", avatar: "EL" },
];

export default function DashboardPage() {
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
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.trend === 'Live' ? 'bg-primary/10 text-primary animate-pulse' : 'bg-green-100 text-green-600'}`}>
                    {stat.trend}
                  </span>
                </div>
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
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Monthly Usage Trends</CardTitle>
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] uppercase font-bold tracking-wider">Last 7 Months</Button>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  stroke="#94a3b8" 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                  fontFamily="Inter"
                  fontWeight={600}
                />
                <YAxis 
                  fontSize={10} 
                  stroke="#94a3b8" 
                  axisLine={false} 
                  tickLine={false} 
                  fontFamily="Inter"
                  fontWeight={600}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#2563EB" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#2563EB', strokeWidth: 3, stroke: '#fff' }} 
                  activeDot={{ r: 8, fill: '#2563EB', strokeWidth: 4, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Usage per College</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] flex items-center justify-center relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-800 leading-none">2.4k</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Logs</span>
            </div>
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
          </CardContent>
          <div className="px-8 pb-8 space-y-3">
            {pieData.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-xs font-extrabold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-none shadow-sm rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Most Used Rooms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {roomStats.map((room) => (
              <div key={room.name} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>{room.name}</span>
                  <span className="text-slate-800">{room.usage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${room.color} rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: `${room.usage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            <Button variant="link" size="sm" className="text-primary font-bold">View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-y border-slate-100">
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Professor Name</th>
                    <th className="px-6 py-4">Room</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentActivity.map((activity, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-lg shadow-sm group-hover:shadow transition-all">
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-[10px] font-bold">{activity.avatar}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-slate-700">{activity.professor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-600">{activity.room}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-none ${
                            activity.action === 'CHECK-IN' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {activity.action}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-medium text-slate-400">{activity.time}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}