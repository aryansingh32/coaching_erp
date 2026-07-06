"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CheckCircle2, XCircle, Search, Save } from "lucide-react"
import { useBatches, useStudents, useMarkAttendance } from "@/lib/api/hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"
import type { Batch } from "@/lib/api/types"

function getBatchId(batch: Batch) {
  return batch.id ?? batch.name ?? batch.student_group_name ?? ''
}

export default function TeachAttendancePage() {
  const { data: batches, isLoading: batchesLoading } = useBatches()
  const { data: students, isLoading: studentsLoading, isError, refetch } = useStudents()
  const markAttendance = useMarkAttendance()

  const [selectedBatch, setSelectedBatch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [attendanceState, setAttendanceState] = useState<Record<string, 'Present' | 'Absent'>>({})

  const batchId = selectedBatch || (batches?.[0] ? getBatchId(batches[0]) : '')
  const today = format(new Date(), 'yyyy-MM-dd')

  const filteredStudents = (students ?? []).filter((s) => {
    const name = `${s.first_name} ${s.last_name ?? ''}`.toLowerCase()
    return name.includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const toggleAttendance = (id: string, status: 'Present' | 'Absent') => {
    setAttendanceState((prev) => ({ ...prev, [id]: status }))
  }

  const handleSave = async () => {
    const entries = Object.entries(attendanceState)
    if (!entries.length) {
      toast.error('Mark attendance for at least one student')
      return
    }

    try {
      await Promise.all(
        entries.map(([studentId, status]) =>
          markAttendance.mutateAsync({
            studentId,
            date: today,
            status,
            batchId,
          })
        )
      )
      toast.success('Attendance submitted via POST /attendance/manual')
      setAttendanceState({})
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message || 'Failed to submit attendance')
    }
  }

  if (batchesLoading || studentsLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[var(--inst-text-primary)] mb-2">Manual Attendance</h2>
        <p className="text-[var(--inst-muted)]">Mark attendance for students via the gateway API.</p>
      </div>

      <Card className="border-[var(--inst-border)] shadow-sm">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
          {batches && batches.length > 0 && (
            <Select value={batchId} onValueChange={setSelectedBatch}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => {
                  const id = getBatchId(b)
                  return (
                    <SelectItem key={id} value={id}>
                      {b.student_group_name ?? b.name ?? id}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--inst-muted)]" />
            <Input
              placeholder="Search student..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={markAttendance.isPending}
            className="bg-[hsl(var(--inst-primary))] hover:bg-[hsl(var(--inst-primary))] text-white shrink-0"
          >
            <Save className="mr-2 h-4 w-4" />
            {markAttendance.isPending ? 'Saving...' : 'Submit'}
          </Button>
        </CardContent>
      </Card>

      {!filteredStudents.length ? (
        <EmptyState title="No students" />
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => {
            const id = student.name
            const status = attendanceState[id]
            return (
              <Card key={id} className="border-[var(--inst-border)]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-[var(--inst-text-primary)]">
                      {student.first_name} {student.last_name ?? ''}
                    </h4>
                    <p className="text-xs font-mono text-[var(--inst-muted)]">{id}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={status === 'Present' ? 'default' : 'outline'}
                      className={status === 'Present' ? 'bg-[var(--inst-success)] hover:bg-[var(--inst-success)]' : ''}
                      onClick={() => toggleAttendance(id, 'Present')}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={status === 'Absent' ? 'destructive' : 'outline'}
                      onClick={() => toggleAttendance(id, 'Absent')}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
