"use client"

import { ParentChildSelector, useActiveStudentId } from "@/components/learn/parent-child-selector"
import { useBatches } from "@/lib/api/hooks"
import { getStudentAttendanceCalendar } from "@/lib/api/services"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LearnAttendancePage() {
  const studentId = useActiveStudentId()
  const { data: batches, isLoading: batchesLoading } = useBatches()
  const [batchId, setBatchId] = useState('')

  const batchList = batches ?? []
  const defaultBatch = batchId || batchList[0]?.name || batchList[0]?.student_group_name || ''

  const { data: attendance, isLoading } = useQuery({
    queryKey: queryKeys.education.attendance(studentId, defaultBatch),
    queryFn: () => getStudentAttendanceCalendar(studentId, defaultBatch),
    enabled: !!studentId && !!defaultBatch,
  })

  if (batchesLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <ParentChildSelector />
      <div>
        <h2 className="text-3xl font-bold">Attendance</h2>
        <p className="text-muted-foreground">View attendance records for the selected child.</p>
      </div>

      {batchList.length > 1 && (
        <Select value={defaultBatch} onValueChange={setBatchId}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Select batch" />
          </SelectTrigger>
          <SelectContent>
            {batchList.map((b) => {
              const id = b.name ?? b.student_group_name ?? ''
              return (
                <SelectItem key={id} value={id}>
                  {b.student_group_name ?? b.name}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      )}

      {isLoading ? (
        <LoadingState />
      ) : !attendance ? (
        <EmptyState title="No attendance data" />
      ) : (
        <Card>
          <CardHeader><CardTitle>Attendance Calendar</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(attendance, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
