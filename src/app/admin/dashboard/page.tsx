
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Clock, Monitor, Users, Activity, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { title: "Total Room Usage", value: "1,284", icon: Monitor, trend: "+12%", color: "text-blue-600" },
  { title: "Total Hours Used", value: "4,512h", icon: Clock, trend: "+8.4%", color: "text-green-600" },
  { title: "Active Professors", value: "48", icon: Users, trend: "+2.1%", color: "text-yellow-600" },
  { title: "Current Sessions", value: "6", icon: Activity, trend: "Live", color: "text-primary" },
];

const barData = [
  { name: "COM LAB 1", value: 120 },
  { name: "COM LAB 2", value: 98 },
  { name: "PHY LAB", value: 65 },
  { name: "CHEM LAB", value: 45 },
  { name: "BIO LAB", value: 38 },
];

const lineData = [
  { name: "Mon", usage: 45 },
  { name: "Tue", usage: 52 },
  { name: "Wed", usage: 48 },
  { name: "Thu", usage: 61 },
  { name: "Fri", usage: 55 },
  { name: "Sat", usage: 32 },
  { name: "Sun", usage: 12 },
];

const pieData = [
  { name: "CICS", value: 45, color: "#266AFF" },
  { name: "CEA", value: 30, color: "#4BC64F" },
  { name: "CAS", value: 15, color: "#FFD43D" },
  { name: "CBA", value: 10, color: "#F0F0F0" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-headline">Operational Overview</h1>
          <p className="text-sm text-muted-foreground">Monitoring laboratory utilization across all campuses.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-white">
            <CalendarIcon size={16} className="mr-2" />
            Last 30 Days
          </Button>
          <Button size="sm">Download Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg bg-slate-100 ${stat.color} group-hover:bg-primary group-hover:text-white transition-colors`}>
                  <stat.icon size={20} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.trend === 'Live' ? 'bg-primary/10 text-primary animate-pulse' : 'bg-green-50 text-green-600'}`}>
                  {stat.trend}
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor size={18} className="text-primary" />
              Usage per Room
            </CardTitle>
            <CardDescription>Number of sessions recorded per laboratory.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} stroke="#64748b" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#266AFF" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" />
              Weekly Activity Trend
            </CardTitle>
            <CardDescription>Frequency of logs throughout the week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} stroke="#64748b" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="usage" stroke="#4BC64F" strokeWidth={3} dot={{ r: 4, fill: '#4BC64F' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Usage by College</CardTitle>
            <CardDescription>Distribution of sessions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-6 pb-6 space-y-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-muted-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Sessions</CardTitle>
            <CardDescription>Live tracking of ongoing laboratory usage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Dr. John Doe', room: 'COM LAB 1', time: '10:30 AM', college: 'CICS' },
                { name: 'Prof. Jane Smith', room: 'COM LAB 2', time: '11:15 AM', college: 'CEA' },
                { name: 'Dr. Robert Brown', room: 'PHY LAB', time: '12:00 PM', college: 'CAS' },
              ].map((session, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border rounded-full flex items-center justify-center text-xs font-bold text-primary">
                      {session.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{session.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{session.college}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{session.room}</p>
                    <p className="text-[10px] text-primary flex items-center gap-1">
                      <Clock size={10} />
                      Started {session.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" size="sm" className="w-full mt-4 text-xs">View All Active Sessions</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
