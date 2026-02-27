
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Filter, Calendar, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MOCK_LOGS } from "@/lib/mock-data";

export default function LogsPage() {
  const [search, setSearch] = useState("");

  const handleExport = (format: 'csv' | 'excel') => {
    alert(`Exporting as ${format.toUpperCase()}...`);
    // Logic for actual export would go here
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-headline">Usage Logs</h1>
          <p className="text-sm text-muted-foreground">Comprehensive history of all laboratory sessions.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Download size={16} className="mr-2" />
              Generate Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>Export as Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search by professor, room, or section..." 
                className="pl-10 h-10 bg-slate-50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                <Filter size={16} className="mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                <Calendar size={16} className="mr-2" />
                Date Range
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Professor</TableHead>
                <TableHead className="font-bold">Room</TableHead>
                <TableHead className="font-bold">Course Info</TableHead>
                <TableHead className="font-bold">Time Period</TableHead>
                <TableHead className="font-bold">Duration</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LOGS.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{log.professorName}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{log.college}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                      {log.roomNumber}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-medium text-slate-700">{log.program}</p>
                      <p className="text-muted-foreground">Section {log.section}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1 text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-accent" />
                        {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {log.endTime && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                          {new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {log.durationMinutes ? `${log.durationMinutes} mins` : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.endTime ? (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">Completed</Badge>
                    ) : (
                      <Badge className="bg-primary text-white border-none animate-pulse">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing 1 to 2 of 24 entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled>1</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">2</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">3</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
