"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Filter, Calendar, MoreHorizontal, FileDown, Database, Users, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_LOGS } from "@/lib/mock-data";

export default function LogsPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Usage Logs</p>
          <h1 className="text-3xl font-extrabold text-slate-800 leading-none">Usage Logs</h1>
          <p className="text-sm text-slate-400 font-medium mt-2">Monitor and export laboratory utilization records.</p>
        </div>
        <Button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-6 h-12 flex items-center gap-2 font-bold transition-all">
          <FileDown size={20} />
          Export Data
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search by professor, room, or section..." 
                className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 bg-white gap-2 text-xs font-bold uppercase tracking-wider">
                <Calendar size={16} />
                Date: Monthly
              </Button>
              <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 bg-white gap-2 text-xs font-bold uppercase tracking-wider">
                <Filter size={16} />
                Room: All
              </Button>
              <Button className="h-12 px-6 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase tracking-wider">
                Confirm
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Professor Name</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Room</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">College</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Program/Section</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Start Time</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">End Time</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_LOGS.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100 rounded-xl shadow-sm">
                          <AvatarImage src={log.professorAvatar} />
                          <AvatarFallback className="rounded-xl text-[10px] font-bold">{log.professorName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-slate-800">{log.professorName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <span className="text-sm font-bold text-slate-600">{log.roomNumber}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <span className="text-sm font-medium text-slate-500">{log.college}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <span className="text-sm font-semibold text-slate-700">{log.program}-{log.section}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-400">{log.startTime}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5 whitespace-nowrap">
                      <span className="text-xs font-medium text-slate-400">{log.endTime || 'In Progress'}</span>
                    </TableCell>
                    <TableCell className="px-8 py-5">
                      <Badge variant="outline" className="bg-slate-50 border-none text-[10px] font-bold text-slate-600 px-3 py-1">
                        {log.durationMinutes ? `${log.durationMinutes} mins` : '--'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">Showing 1 to 5 of 24 entries</p>
            <div className="flex gap-2">
              <Button size="icon" className="h-8 w-8 rounded-lg bg-primary text-white shadow-md shadow-primary/20 font-bold">1</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 font-bold">2</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 font-bold">3</Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 border-none font-bold">{">"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white flex items-center p-6 gap-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
            <Database size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Hours (Monthly)</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">1,248 hrs</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white flex items-center p-6 gap-6">
          <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Student Footfall</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">4,520</p>
          </div>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white flex items-center p-6 gap-6">
          <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Reported Issues</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">12</p>
          </div>
        </Card>
      </div>
    </div>
  );
}