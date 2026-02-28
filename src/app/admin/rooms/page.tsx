
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, doc, deleteDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";

export default function RoomsPage() {
  const [search, setSearch] = useState("");
  const db = useFirestore();
  const { toast } = useToast();

  const roomsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, "rooms");
  }, [db]);

  const { data: rooms, loading } = useCollection<any>(roomsQuery);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room: any) => 
      room.number?.toLowerCase().includes(search.toLowerCase()) ||
      room.location?.toLowerCase().includes(search.toLowerCase())
    );
  }, [rooms, search]);

  const handleAddRoom = () => {
    if (!db) return;
    const roomNumber = prompt("Enter Room Number (e.g., Lab 402):");
    const location = prompt("Enter Location (e.g., Engineering Hall):");
    
    if (roomNumber && location) {
      addDoc(collection(db, "rooms"), {
        number: roomNumber,
        location: location,
        status: "available",
        usageCount: 0,
      }).catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "rooms",
          operation: "create",
          requestResourceData: { number: roomNumber, location, status: "available" },
        });
        errorEmitter.emit("permission-error", permissionError);
      });
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    if (!db || !confirm("Are you sure you want to delete this room?")) return;
    deleteDoc(doc(db, "rooms", roomId)).catch(async (error) => {
      const permissionError = new FirestorePermissionError({
        path: `rooms/${roomId}`,
        operation: "delete",
      });
      errorEmitter.emit("permission-error", permissionError);
    });
  };

  if (loading) {
    return (
      <div className="h-96 w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[10px] text-primary uppercase font-bold tracking-[0.2em] mb-1">Admin / Room Management</p>
          <h1 className="text-3xl font-extrabold text-slate-800">Room Management</h1>
        </div>
        <Button onClick={handleAddRoom} className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-12 shadow-lg shadow-primary/20 flex items-center gap-2 font-bold">
          <Plus size={20} />
          Add New Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Total Rooms</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold text-slate-800 leading-none">{rooms.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Currently Occupied</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold text-slate-800 leading-none">
                {rooms.filter((r: any) => r.status === 'in-use').length}
              </span>
              <span className="text-xs font-bold text-slate-300">/ {rooms.length} total</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-4">Maintenance</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold text-orange-500 leading-none">
                {rooms.filter((r: any) => r.status === 'maintenance').length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search by room number or location..." 
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
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Location</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Usage Count</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Status</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room: any) => (
                <TableRow key={room.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="px-8 py-5">
                    <span className="text-sm font-bold text-primary">{room.number}</span>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <span className="text-sm font-semibold text-slate-600">{room.location}</span>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-800">{room.usageCount || 0}</span>
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
                      {room.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => handleDeleteRoom(room.id)} variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                    No rooms found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
