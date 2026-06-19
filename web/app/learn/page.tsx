"use client"

import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useStudent, useBatches, usePendingFees, useLiveClasses } from "@/lib/api/hooks"
import { ParentChildSelector, useActiveStudentId } from "@/components/learn/parent-child-selector"
import { FeatureGate } from "@/components/shared/feature-gate"
import { BookOpen, Clock, Award, Video } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressRing } from "@/components/shared/progress-ring"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import type { Batch } from "@/lib/api/types"

function getBatchName(batch: Batch) {
  return batch.student_group_name ?? batch.name ?? batch.id ?? 'Batch'
}

export default function StudentDashboard() {
  const studentId = useActiveStudentId()
  const displayName = useAuthStore((s) => s.displayName) ?? 'Student'

  const { data: student, isLoading, isError, refetch } = useStudent(studentId)
  const { data: batches } = useBatches()
  const { data: pendingFees } = usePendingFees(studentId)
  const { data: liveClasses } = useLiveClasses()

  if (isLoading) return <LoadingState message="Loading your dashboard..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const attendance = student?.attendance_percentage ?? 0
  const pendingTotal = pendingFees?.reduce((s, f) => s + f.amount, 0) ?? 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ParentChildSelector />
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {displayName}!</h2>
          <p className="text-muted-foreground max-w-md">
            Your learning data is synced from ERPNext and Moodle via the gateway.
          </p>
          {student?.custom_rank && (
            <Badge variant="secondary" className="mt-4 bg-primary/20 text-primary">
              <Award className="w-3 h-3 mr-1" /> Rank #{student.custom_rank}
            </Badge>
          )}
        </div>
        <ProgressRing value={attendance} size="xl" color="primary" showValue />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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

        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Pending Fees
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                {liveClasses.map((m) => (
                  <li key={m.meetingId} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-sm font-medium">{m.name}</span>
                    <Link
                      href={`/learn/live-class/${m.meetingId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Join
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </FeatureGate>
    </div>
  )
}
