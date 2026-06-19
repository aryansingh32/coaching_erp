"use client"

import { useBatches } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import type { Batch } from "@/lib/api/types"

function getBatchName(batch: Batch) {
  return batch.student_group_name ?? batch.name ?? batch.id ?? 'Batch'
}

export default function TeachBatchesPage() {
  const { data: batches, isLoading, isError, refetch } = useBatches()

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">My Batches</h2>
        <p className="text-slate-500">From GET /batches</p>
      </div>

      {!batches?.length ? (
        <EmptyState title="No batches" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {batches.map((batch) => (
            <Card key={getBatchName(batch)}>
              <CardHeader>
                <CardTitle>{getBatchName(batch)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <p>Program: {batch.program ?? '—'}</p>
                <p>Year: {batch.academic_year ?? '—'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
