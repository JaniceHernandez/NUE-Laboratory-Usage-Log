
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Monitor, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MOCK_ROOMS } from "@/lib/mock-data";

export default function RoomsPage() {
  const [rooms, setRooms] = useState(MOCK_ROOMS);

  const deleteRoom = (id: string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      setRooms(rooms.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-headline">Manage Laboratory Rooms</h1>
          <p className="text-sm text-muted-foreground">Add, update, or remove lab resources from the system.</p>
        </div>
        <Button className="bg-primary">
          <Plus size={18} className="mr-2" />
          Add New Room
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-base">Room Statistics</CardTitle>
            <CardDescription>Overview of all managed spaces.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-[10px] text-primary uppercase font-bold tracking-wider">Total Rooms</p>
              <p className="text-3xl font-bold">{rooms.length}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-muted-foreground">Available</span>
                </div>
                <span className="font-bold">{rooms.filter(r => r.status === 'available').length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">In Use</span>
                </div>
                <span className="font-bold">{rooms.filter(r => r.status === 'in-use').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input placeholder="Search room by number or usage..." className="pl-10 h-10 bg-slate-50 border-none" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Room Name/Number</TableHead>
                  <TableHead className="font-bold">Total Sessions</TableHead>
                  <TableHead className="font-bold">Current Status</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-primary">
                          <Monitor size={20} />
                        </div>
                        <span className="font-bold text-slate-700">{room.number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BarChart3 size={14} className="text-muted-foreground" />
                        <span className="font-medium">{room.usageCount} sessions</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${room.status === 'available' ? 'bg-accent' : 'bg-destructive'}`} />
                        <span className={`text-xs font-semibold capitalize ${room.status === 'available' ? 'text-accent' : 'text-destructive'}`}>
                          {room.status.replace('-', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                          <Edit2 size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-destructive"
                          onClick={() => deleteRoom(room.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
