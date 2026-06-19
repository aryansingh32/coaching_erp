"use client"

import { Clock, Users, BookOpen } from "lucide-react"
import { useBatches, useStudents } from "@/lib/api/hooks"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import type { Batch } from "@/lib/api/types"

function getBatchName(batch: Batch) {
  return batch.student_group_name ?? batch.name ?? batch.id ?? 'Batch'
}

export default function TeachDashboard() {
  const displayName = useAuthStore((s) => s.displayName) ?? 'Teacher'
  const { data: batches, isLoading, isError, refetch } = useBatches()
  const { data: students } = useStudents()

  if (isLoading) return <LoadingState message="Loading schedule..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          Good morning, {displayName}.
        </h2>
        <p className="text-slate-500">
          You have {batches?.length ?? 0} batch(es) assigned.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">My Batches</CardTitle>
            <BookOpen className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{batches?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Students</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{students?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Classes Today</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{batches?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-bold text-slate-900">Your Batches</h3>

      {!batches?.length ? (
        <EmptyState title="No batches assigned" />
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <Card key={getBatchName(batch)} className="shadow-sm border-slate-200">
              <CardContent className="p-6">
                <h4 className="font-bold text-lg text-slate-900">{getBatchName(batch)}</h4>
                <p className="text-slate-600">{batch.program ?? '—'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
