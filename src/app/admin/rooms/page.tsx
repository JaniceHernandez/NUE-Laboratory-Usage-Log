"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Monitor, BarChart3, Filter, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MOCK_ROOMS } from "@/lib/mock-data";

export default function RoomsPage() {
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Room Management</p>
          <h1 className="text-3xl font-extrabold text-slate-800">Room Management</h1>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-12 shadow-lg shadow-primary/20 flex items-center gap-2 font-bold">
          <Plus size={20} />
          Add New Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Total Rooms</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold text-slate-800 leading-none">24</span>
              <span className="text-[10px] text-green-500 font-bold mb-1">+2 this month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Currently Occupied</p>
            <div className="space-y-2">
              <div className="flex items-end gap-3">
                <span className="text-4xl font-extrabold text-slate-800 leading-none">8</span>
                <span className="text-xs font-bold text-slate-300">/ 24 total</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '33%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Maintenance</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold text-orange-500 leading-none">2</span>
              <span className="text-[10px] text-slate-400 font-bold mb-1">Scheduled next week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search by room number or building..." 
              className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Room Number</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Building / Location</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Usage Count</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Status</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="px-8 py-5">
                    <span className="text-sm font-bold text-primary cursor-pointer hover:underline">{room.number}</span>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <span className="text-sm font-semibold text-slate-600">{room.location}</span>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-800">{room.usageCount}</span>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border-none flex items-center gap-1.5 w-fit ${
                        room.status === 'available' 
                          ? 'bg-green-100 text-green-600' 
                          : room.status === 'in-use'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      <span className={`w-1 h-1 rounded-full ${
                        room.status === 'available' ? 'bg-green-600' : room.status === 'in-use' ? 'bg-blue-600' : 'bg-orange-600'
                      }`} />
                      {room.status.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all">
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400">Showing 1 to 5 of 24 entries</p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 border-none pointer-events-none">{"<"}</Button>
              <Button size="icon" className="h-8 w-8 rounded-lg bg-primary text-white shadow-md shadow-primary/20 font-bold">1</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 font-bold">2</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 font-bold">3</Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 border-none font-bold">{">"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}