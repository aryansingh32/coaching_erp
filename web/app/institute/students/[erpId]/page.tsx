"use client"

import { use } from "react"
import Link from "next/link"
import { useStudent, useStudentTimeline } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ erpId: string }>
}) {
  const { erpId } = use(params)
  const decodedId = decodeURIComponent(erpId)
  const { data: student, isLoading, isError, refetch } = useStudent(decodedId)
  const { data: timeline } = useStudentTimeline(decodedId)

  if (isLoading) return <LoadingState />
  if (isError || !student) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">
            {student.first_name} {student.last_name ?? ''}
          </h3>
          <p className="text-muted-foreground font-mono text-sm">{decodedId}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/institute/students">Back to list</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {student.student_email_id ?? '—'}</p>
            <p><span className="text-muted-foreground">Phone:</span> {student.student_mobile_number ?? '—'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {!timeline?.length ? (
              <EmptyState title="No timeline events" />
            ) : (
              <ul className="space-y-3">
                {timeline.map((event, i) => (
                  <li key={i} className="flex justify-between text-sm border-b pb-2">
                    <span>{event.event}</span>
                    <span className="text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
