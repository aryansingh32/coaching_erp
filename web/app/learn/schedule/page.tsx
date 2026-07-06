"use client"

import { ParentChildSelector, useActiveStudentId } from "@/components/learn/parent-child-selector"
import { useStudentSchedule } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { CalendarView, CalendarEvent } from "@/components/shared/calendar-view"

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
        <Card className="shadow-sm border-inst-border">
          <CardHeader className="pb-3 border-b bg-muted/10">
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <CalendarView 
              events={(schedule as any[])?.map(s => ({
                date: s.schedule_date,
                type: 'class',
                title: `${s.course} (${s.from_time} - ${s.to_time})`
              })) || []} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
