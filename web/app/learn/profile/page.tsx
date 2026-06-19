"use client"

import { useAuthStore } from "@/lib/stores/auth-store"
import { useStudent, usePendingFees } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { RazorpayCheckout } from "@/components/payments/razorpay-checkout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"

export default function ProfilePage() {
  const erpId = useAuthStore((s) => s.erpId) ?? ''
  const qc = useQueryClient()
  const { data: student, isLoading, isError, refetch } = useStudent(erpId)
  const { data: pendingFees, refetch: refetchFees } = usePendingFees(erpId)

  const onPaymentSuccess = () => {
    refetchFees()
    qc.invalidateQueries({ queryKey: queryKeys.fees.pending(erpId) })
  }

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile & Fees</h2>
        <p className="text-muted-foreground font-mono text-sm">{erpId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {student?.first_name} {student?.last_name ?? ''}
          </p>
          <p className="text-muted-foreground">{student?.student_email_id ?? '—'}</p>
          <p className="text-muted-foreground">{student?.student_mobile_number ?? '—'}</p>
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
                        studentId={erpId}
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
    </div>
  )
}
