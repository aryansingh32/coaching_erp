"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Plus, FileDown, FileUp, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProgressRing } from "@/components/shared/progress-ring"

interface Student {
  id: string
  first_name: string
  last_name: string
  student_email_id: string
  student_mobile_number: string
  custom_rank?: number
  attendance_percentage?: number
  status: "Active" | "Inactive" | "Suspended"
}

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch students from the gateway
  const { data, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => apiClient.get("/students"),
  })

  const students: Student[] = data?.data || [
    {
      id: "STU-001",
      first_name: "Aarav",
      last_name: "Sharma",
      student_email_id: "aarav@example.com",
      student_mobile_number: "9876543210",
      custom_rank: 12,
      attendance_percentage: 92,
      status: "Active"
    },
    {
      id: "STU-002",
      first_name: "Priya",
      last_name: "Patel",
      student_email_id: "priya@example.com",
      student_mobile_number: "9876543211",
      custom_rank: 4,
      attendance_percentage: 98,
      status: "Active"
    },
    {
      id: "STU-003",
      first_name: "Rohan",
      last_name: "Gupta",
      student_email_id: "rohan@example.com",
      student_mobile_number: "9876543212",
      attendance_percentage: 74,
      status: "Active"
    }
  ]

  const filteredStudents = students.filter(student => 
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-institute-text-primary">Students</h3>
          <p className="text-muted-foreground">Manage your enrolled students and their academic profiles.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <FileUp className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <Card className="border-institute-border shadow-sm">
        <CardHeader className="py-4">
          <div className="flex items-center w-full max-w-sm relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students by name or ID..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Attendance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading students...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="group">
                    <TableCell className="font-medium font-mono text-sm">{student.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-institute-text-primary">
                            {student.first_name} {student.last_name}
                          </div>
                          {student.custom_rank && (
                            <div className="text-xs text-muted-foreground">
                              Rank: #{student.custom_rank}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{student.student_mobile_number}</div>
                      <div className="text-xs text-muted-foreground">{student.student_email_id}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <ProgressRing 
                          value={student.attendance_percentage || 0} 
                          size="sm" 
                          color={(student.attendance_percentage || 0) > 85 ? "success" : "warning"} 
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        {student.status === "Active" ? (
                          <CheckCircle2 className="mr-1 h-4 w-4 text-institute-success" />
                        ) : (
                          <XCircle className="mr-1 h-4 w-4 text-institute-danger" />
                        )}
                        <span className={student.status === "Active" ? "text-institute-success" : "text-institute-danger"}>
                          {student.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
