"use client"

import { useState, useMemo } from "react"
import { Search, Download, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Mock dataset representing 200+ students for search testing
const MOCK_ATTENDANCE_DATA = Array.from({ length: 250 }).map((_, i) => ({
  id: `STU-${(i + 1).toString().padStart(4, '0')}`,
  name: ["Alice", "Bob", "Charlie", "David", "Eve", "Faythe", "Grace", "Heidi"][i % 8] + " " + ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis"][i % 6],
  batchId: ["BCH-A-24", "BCH-B-24", "BCH-C-24"][i % 3],
  status: Math.random() > 0.15 ? "Present" : "Absent",
  lastPunch: Math.random() > 0.15 ? "08:45 AM" : "-",
}))

export function BatchAttendanceTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | "Present" | "Absent">("All")
  
  const filteredData = useMemo(() => {
    return MOCK_ATTENDANCE_DATA.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.batchId.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "All" || student.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter])

  return (
    <Card className="border-institute-border shadow-sm">
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or batch..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant={statusFilter === "All" ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("All")}
            >
              All
            </Button>
            <Button 
              variant={statusFilter === "Present" ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("Present")}
            >
              Present
            </Button>
            <Button 
              variant={statusFilter === "Absent" ? "default" : "outline"} 
              size="sm"
              onClick={() => setStatusFilter("Absent")}
            >
              Absent
            </Button>
            <Button variant="outline" size="sm" className="ml-auto sm:ml-2">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Last Punch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.slice(0, 10).map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-xs">{student.id}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50">{student.batchId}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={student.status === "Present" ? "bg-institute-success/10 text-institute-success hover:bg-institute-success/20" : "bg-institute-danger/10 text-institute-danger hover:bg-institute-danger/20"}
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{student.lastPunch}</TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-2 py-4 text-sm text-muted-foreground">
          <div>
            Showing {Math.min(filteredData.length, 10)} of {filteredData.length} records
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
