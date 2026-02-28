"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Loader2, Monitor, MapPin, Building, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { RoomService, Room } from "@/services/room-service";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RoomsPage() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRoom, setNewRoom] = useState({ number: "", location: "", status: "available" as const });
  
  const db = useFirestore();
  const { toast } = useToast();

  const roomsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "rooms"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: rooms, loading } = useCollection<Room>(roomsQuery);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => 
      room.number?.toLowerCase().includes(search.toLowerCase()) ||
      room.location?.toLowerCase().includes(search.toLowerCase())
    );
  }, [rooms, search]);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setIsSubmitting(true);
    try {
      await RoomService.addRoom(db, {
        number: newRoom.number,
        location: newRoom.location,
        status: newRoom.status,
      });
      setIsDialogOpen(false);
      setNewRoom({ number: "", location: "", status: "available" });
      toast({ title: "Success", description: "Laboratory room added successfully." });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: "rooms",
        operation: "create",
        requestResourceData: newRoom,
      });
      errorEmitter.emit("permission-error", permissionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!db || !confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;
    
    try {
      await RoomService.deleteRoom(db, roomId);
      toast({ title: "Deleted", description: "Room has been removed from the system." });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: `rooms/${roomId}`,
        operation: "delete",
      });
      errorEmitter.emit("permission-error", permissionError);
    }
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
          <h1 className="text-3xl font-extrabold text-slate-800">Laboratory Rooms</h1>
          <p className="text-sm text-slate-400 font-medium">Configure and monitor active laboratory facilities.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-12 shadow-lg shadow-primary/20 flex items-center gap-2 font-bold transition-all">
          <Plus size={20} />
          Add Facility
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Facilities", value: rooms.length, icon: Building, color: "text-blue-500", bgColor: "bg-blue-50" },
          { label: "Online Labs", value: rooms.filter(r => r.status === 'available').length, icon: Activity, color: "text-green-500", bgColor: "bg-green-50" },
          { label: "Inactive Labs", value: rooms.filter(r => r.status !== 'available').length, icon: Monitor, color: "text-orange-500", bgColor: "bg-orange-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-6 flex items-center gap-6">
              <div className={`w-14 h-14 ${stat.bgColor} ${stat.color} rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{stat.label}</p>
                <span className="text-3xl font-extrabold text-slate-800 leading-none">{stat.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Filter by name or location..." 
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
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Facility Number</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Building / Location</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Total Logins</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14">Status</TableHead>
                <TableHead className="px-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest h-14 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow key={room.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                  <TableCell className="px-8 py-5">
                    <span className="text-sm font-bold text-primary">{room.number}</span>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <MapPin size={14} className="text-slate-300" />
                      {room.location}
                    </div>
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
                          : room.status === 'inactive'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      {room.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right">
                    <Button 
                      onClick={() => handleDeleteRoom(room.id!)} 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-medium">
                    No matching facilities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Register New Facility</DialogTitle>
            <DialogDescription>Define a new laboratory room for usage tracking.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRoom} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber" className="text-xs font-bold uppercase text-slate-500">Room Number</Label>
              <Input 
                id="roomNumber" 
                placeholder="e.g., COM LAB 402" 
                className="h-12 rounded-xl border-slate-200 bg-slate-50"
                value={newRoom.number}
                onChange={(e) => setNewRoom({...newRoom, number: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-bold uppercase text-slate-500">Location / Building</Label>
              <Input 
                id="location" 
                placeholder="e.g., Engineering Hall, 4th Floor" 
                className="h-12 rounded-xl border-slate-200 bg-slate-50"
                value={newRoom.location}
                onChange={(e) => setNewRoom({...newRoom, location: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-bold uppercase text-slate-500">Initial Status</Label>
              <Select 
                value={newRoom.status} 
                onValueChange={(val: any) => setNewRoom({...newRoom, status: val})}
              >
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary rounded-xl font-bold shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Register Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
