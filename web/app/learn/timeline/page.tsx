"use client"

import { useAuthStore } from "@/lib/stores/auth-store"
import { useStudentTimeline } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"

export default function TimelinePage() {
  const erpId = useAuthStore((s) => s.erpId) ?? ''
  const { data: timeline, isLoading } = useStudentTimeline(erpId)

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Activity Timeline</h2>
        <p className="text-muted-foreground">Events from GET /students/:erpId/timeline</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
          {!timeline?.length ? (
            <EmptyState title="No events yet" />
          ) : (
            <ul className="space-y-4">
              {timeline.map((event, i) => (
                <li key={i} className="flex gap-4 items-start border-l-2 border-primary pl-4 py-2">
                  <div>
                    <p className="font-medium">{event.event}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
