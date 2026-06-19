"use client"

import { use } from "react"
import { useBatch } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = use(params)
  const id = decodeURIComponent(batchId)
  const { data: batch, isLoading, isError, refetch } = useBatch(id)

  if (isLoading) return <LoadingState />
  if (isError || !batch) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {batch.student_group_name ?? batch.name ?? id}
        </h2>
        <p className="text-muted-foreground font-mono text-sm">{id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Program:</span> {batch.program ?? '—'}</p>
          <p><span className="text-muted-foreground">Academic Year:</span> {batch.academic_year ?? '—'}</p>
          <p><span className="text-muted-foreground">Term:</span> {batch.academic_term ?? '—'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
