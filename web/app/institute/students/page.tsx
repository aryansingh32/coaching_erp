"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Plus, FileUp, MoreHorizontal, CheckCircle2, XCircle } from "lucide-react"
import { useStudents, useBulkImportStudents } from "@/lib/api/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProgressRing } from "@/components/shared/progress-ring"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"
import type { Student } from "@/lib/api/types"

function getStudentId(student: Student) {
  return student.name
}

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: students, isLoading, isError, refetch } = useStudents()
  const bulkImport = useBulkImportStudents()

  const filteredStudents = (students ?? []).filter((student) => {
    const name = `${student.first_name} ${student.last_name ?? ''}`.toLowerCase()
    const id = getStudentId(student).toLowerCase()
    const q = searchQuery.toLowerCase()
    return name.includes(q) || id.includes(q)
  })

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const result = await bulkImport.mutateAsync(file)
        toast.success(`Imported ${(result as { count?: number }).count ?? ''} students`)
      } catch (err: unknown) {
        const e = err as { message?: string }
        toast.error(e?.message || 'Import failed')
      }
    }
    input.click()
  }

  if (isLoading) return <LoadingState message="Loading students..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Students</h3>
          <p className="text-muted-foreground">Manage enrolled students from ERPNext.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImport} disabled={bulkImport.isPending}>
            <FileUp className="mr-2 h-4 w-4" />
            {bulkImport.isPending ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button size="sm" asChild>
            <Link href="/institute/students/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-institute-border shadow-sm">
        <CardHeader className="py-4">
          <div className="flex items-center w-full max-w-sm relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <EmptyState title="No students found" />
          ) : (
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
                {filteredStudents.map((student) => {
                  const id = getStudentId(student)
                  const isActive = student.enabled !== 0
                  return (
                    <TableRow key={id} className="group">
                      <TableCell className="font-medium font-mono text-sm">{id}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {student.first_name[0]}
                            {(student.last_name ?? '')[0] ?? ''}
                          </div>
                          <div>
                            <div className="font-medium">
                              {student.first_name} {student.last_name ?? ''}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{student.student_mobile_number ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.student_email_id ?? '—'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {student.attendance_percentage != null && (
                          <div className="flex justify-center">
                            <ProgressRing
                              value={student.attendance_percentage}
                              size="sm"
                              color={student.attendance_percentage > 85 ? 'success' : 'warning'}
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          {isActive ? (
                            <CheckCircle2 className="mr-1 h-4 w-4 text-institute-success" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4 text-institute-danger" />
                          )}
                          <span className={isActive ? 'text-institute-success' : 'text-institute-danger'}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/institute/students/${encodeURIComponent(id)}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
