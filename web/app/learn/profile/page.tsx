"use client"

import { useAuthStore } from "@/lib/stores/auth-store"
import { useStudent, usePendingFees, useApplyLeave, useBatches } from "@/lib/api/hooks"
import { ParentChildSelector, useActiveStudentId } from "@/components/learn/parent-child-selector"
import { FeatureGate } from "@/components/shared/feature-gate"
import { RazorpayCheckout } from "@/components/payments/razorpay-checkout"
import { NotificationPreferences } from "@/components/notifications/notification-preferences"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"
import { LeaveRequestForm } from "@/components/learn/leave-request-form"
import { UpdateStudentInfo } from "@/components/learn/update-student-info"

export default function ProfilePage() {
  const role = useAuthStore((s) => s.role)
  const studentId = useActiveStudentId()
  const qc = useQueryClient()
  const { data: student, isLoading, isError, refetch } = useStudent(studentId)
  const { data: pendingFees, refetch: refetchFees } = usePendingFees(studentId)
  const { data: batches } = useBatches()

  const onPaymentSuccess = () => {
    refetchFees()
    qc.invalidateQueries({ queryKey: queryKeys.fees.pending(studentId) })
  }

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const title = role === 'parent' ? 'Child Profile & Fees' : 'Profile & Fees'

  const batchOptions = batches ?? []

  return (
    <div className="space-y-6">
      <ParentChildSelector />
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground font-mono text-sm">{studentId}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>{role === 'parent' ? 'Child Profile' : 'Profile'}</CardTitle>
          <UpdateStudentInfo student={student} />
        </CardHeader>
        <CardContent className="space-y-2 text-sm pt-4">
          <p className="font-semibold text-lg">
            {student?.first_name} {student?.last_name ?? ''}
          </p>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="w-4 h-4 inline-block bg-muted rounded-full flex items-center justify-center text-[10px]">✉️</span>
            {student?.student_email_id ?? '—'}
          </p>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="w-4 h-4 inline-block bg-muted rounded-full flex items-center justify-center text-[10px]">📱</span>
            {student?.student_mobile_number ?? '—'}
          </p>
        </CardContent>
      </Card>

      <FeatureGate feature="fees_management">
        <Card>
          <CardHeader>
            <CardTitle>Pending Fees</CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingFees?.length ? (
              <EmptyState title="No pending fees" />
            ) : (
              <ul className="space-y-3">
                {pendingFees.map((fee) => (
                  <li key={fee.fee_id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <div>
                      <p className="font-medium">₹{fee.amount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-muted-foreground">
                        {fee.description ? `${fee.description} · ` : ''}Due {fee.due_date}
                      </p>
                    </div>
                    <FeatureGate feature="online_payments" hide>
                      <RazorpayCheckout
                        studentId={studentId}
                        feeId={fee.fee_id}
                        amount={fee.amount}
                        onSuccess={onPaymentSuccess}
                      />
                    </FeatureGate>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </FeatureGate>

      <div className="flex justify-start">
        <LeaveRequestForm studentId={studentId} batches={batchOptions} />
      </div>

      <NotificationPreferences />
    </div>
  )
}
