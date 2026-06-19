"use client"

import { ParentChildSelector, useActiveStudentId } from "@/components/learn/parent-child-selector"
import { useStudentSchedule } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"

export default function LearnSchedulePage() {
  const studentId = useActiveStudentId()
  const { data: schedule, isLoading } = useStudentSchedule(studentId)

  return (
    <div className="space-y-6">
      <ParentChildSelector />
      <div>
        <h2 className="text-3xl font-bold">My Schedule</h2>
        <p className="text-muted-foreground">Course schedule from education API (Vue Schedule.vue parity).</p>
      </div>
      {isLoading ? (
        <LoadingState />
      ) : !schedule ? (
        <EmptyState title="No schedule data" />
      ) : (
        <Card>
          <CardHeader><CardTitle>Upcoming Classes</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(schedule, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
