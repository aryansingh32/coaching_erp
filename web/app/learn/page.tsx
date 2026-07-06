"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useStudent, useBatches, usePendingFees, useLiveClasses, useParentChildren } from "@/lib/api/hooks"
import { useLiveClassSocket } from "@/lib/api/socket"
import { ParentChildSelector, useActiveStudentId } from "@/components/learn/parent-child-selector"
import { FeatureGate } from "@/components/shared/feature-gate"
import { BookOpen, Clock, Award, Video, Users, IndianRupee } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressRing } from "@/components/shared/progress-ring"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SchoolDiaryFeed } from "@/components/learn/school-diary-feed"
import type { Batch, Student } from "@/lib/api/types"
import { useQueries } from "@tanstack/react-query"
import * as api from "@/lib/api/services"
import { queryKeys } from "@/lib/api/query-keys"

function getBatchName(batch: Batch) {
  return batch.student_group_name ?? batch.name ?? batch.id ?? 'Batch'
}

function ParentFeeRollup() {
  const linkedStudents = useAuthStore((s) => s.linkedStudents)
  const { data: children } = useParentChildren()
  const childIds = useMemo(() => {
    const fromApi = (children as Student[] | undefined)?.map((c) => c.name) ?? []
    return fromApi.length ? fromApi : linkedStudents
  }, [children, linkedStudents])

  const feeQueries = useQueries({
    queries: childIds.map((id) => ({
      queryKey: queryKeys.fees.pending(id),
      queryFn: () => api.getPendingFees(id),
      enabled: !!id,
    })),
  })

  const totalPending = feeQueries.reduce((sum, q) => {
    const fees = q.data ?? []
    return sum + fees.reduce((s, f) => s + f.amount, 0)
  }, 0)

  const childCount = childIds.length

  if (!childCount) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <p className="font-semibold">
              {childCount} {childCount === 1 ? 'child' : 'children'}
            </p>
            <p className="text-sm text-muted-foreground">
              ₹{totalPending.toLocaleString('en-IN')} pending across all children
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/learn/profile">
            <IndianRupee className="w-4 h-4 mr-2" />
            Pay Fees
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function StudentDashboard() {
  const role = useAuthStore((s) => s.role)
  const studentId = useActiveStudentId()
  const displayName = useAuthStore((s) => s.displayName) ?? 'Student'

  const { data: student, isLoading, isError, refetch } = useStudent(studentId)
  const { data: batches } = useBatches()
  const { data: pendingFees } = usePendingFees(studentId)
  const { data: liveClasses } = useLiveClasses()
  const { activeClasses } = useLiveClassSocket()

  if (isLoading) return <LoadingState message="Loading your dashboard..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const attendance = student?.attendance_percentage ?? 0
  const pendingTotal = pendingFees?.reduce((s, f) => s + f.amount, 0) ?? 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ParentChildSelector />
      {role === 'parent' && <ParentFeeRollup />}

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back, {displayName}!
          </h2>
          <p className="text-muted-foreground max-w-md">
            {role === 'parent'
              ? 'View your children\'s attendance, fees, and activity.'
              : 'Your learning data is synced from ERPNext and Moodle via the gateway.'}
          </p>
          {student?.custom_rank && role !== 'parent' && (
            <Badge variant="secondary" className="mt-4 bg-primary/20 text-primary">
              <Award className="w-3 h-3 mr-1" /> Rank #{student.custom_rank}
            </Badge>
          )}
        </div>
        {role !== 'parent' && (
          <ProgressRing value={attendance} size="xl" color="primary" showValue />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {role !== 'parent' && (
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-primary" />
                My Batches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!batches?.length ? (
                <EmptyState title="No batches enrolled" />
              ) : (
                <ul className="space-y-3">
                  {batches.map((b) => (
                    <li key={getBatchName(b)} className="p-3 rounded-lg bg-accent/30 text-sm font-medium">
                      {getBatchName(b)}
                      {b.program && (
                        <span className="text-muted-foreground ml-2">— {b.program}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {role !== 'parent' && (
          <div className="md:row-span-2">
            <SchoolDiaryFeed batchName={batches?.[0]?.name ?? batches?.[0]?.student_group_name} />
          </div>
        )}

        <Card className="border-border bg-card/50 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              {role === 'parent' ? 'Selected Child — Pending Fees' : 'Pending Fees'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingFees?.length ? (
              <EmptyState title="All clear" description="No pending fee installments." />
            ) : (
              <div className="space-y-2">
                <p className="text-2xl font-bold">₹{pendingTotal.toLocaleString('en-IN')}</p>
                <p className="text-sm text-muted-foreground">
                  {pendingFees.length} installment(s) due
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/learn/profile">View & Pay</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {role !== 'parent' && (
        <FeatureGate feature="live_classes" hide>
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="w-5 h-5 mr-2 text-primary" />
                Live Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!liveClasses?.length ? (
                <EmptyState title="No live classes right now" />
              ) : (
                <ul className="space-y-3">
                  {liveClasses.map((m) => {
                    const isActive = activeClasses.some(ac => ac.meetingId === m.meetingId)
                    return (
                      <li key={m.meetingId} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                          )}
                          <span className="text-sm font-medium">{m.name}</span>
                        </div>
                        <Link
                          href={`/learn/live-class/${m.meetingId}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Join
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </FeatureGate>
      )}
    </div>
  )
}
