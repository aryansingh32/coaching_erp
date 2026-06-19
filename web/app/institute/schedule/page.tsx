"use client"

import { useBatches } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"

export default function InstituteSchedulePage() {
  const { data: batches, isLoading } = useBatches()

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Class Schedule</h3>
        <p className="text-muted-foreground">Batch schedules from ERPNext Course Schedule (via batches).</p>
      </div>
      {!batches?.length ? (
        <EmptyState title="No schedules" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {batches.map((b) => (
            <Card key={b.name ?? b.id}>
              <CardHeader>
                <CardTitle>{b.student_group_name ?? b.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Program: {b.program ?? '—'} · Year: {b.academic_year ?? '—'}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
