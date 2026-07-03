"use client"

import { useAuthStore } from "@/lib/stores/auth-store"
import { useStudent, usePendingFees, useApplyLeave, useBatches } from "@/lib/api/hooks"
import { ParentChildSelector, useActiveStudentId } from "@/components/learn/parent-child-selector"
import { FeatureGate } from "@/components/shared/feature-gate"
import { RazorpayCheckout } from "@/components/payments/razorpay-checkout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"
import { useState } from "react"
import { toast } from "sonner"

export default function ProfilePage() {
  const role = useAuthStore((s) => s.role)
  const studentId = useActiveStudentId()
  const qc = useQueryClient()
  const { data: student, isLoading, isError, refetch } = useStudent(studentId)
  const { data: pendingFees, refetch: refetchFees } = usePendingFees(studentId)
  const { data: batches } = useBatches()
  const applyLeave = useApplyLeave()
  const [leaveForm, setLeaveForm] = useState({
    from_date: '',
    to_date: '',
    reason: '',
    student_group: '',
  })

  const onPaymentSuccess = () => {
    refetchFees()
    qc.invalidateQueries({ queryKey: queryKeys.fees.pending(studentId) })
  }

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const title = role === 'parent' ? 'Child Profile & Fees' : 'Profile & Fees'

  const handleLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await applyLeave.mutateAsync({ studentId, data: leaveForm })
      toast.success('Leave request submitted')
      setLeaveForm({ from_date: '', to_date: '', reason: '', student_group: '' })
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Could not submit leave')
    }
  }

  const batchOptions = batches ?? []

  return (
    <div className="space-y-6">
      <ParentChildSelector />
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground font-mono text-sm">{studentId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{role === 'parent' ? 'Child Profile' : 'Profile'}</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Request Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLeave} className="space-y-4 max-w-md">
            <div>
              <Label>Batch</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={leaveForm.student_group}
                onChange={(e) => setLeaveForm({ ...leaveForm, student_group: e.target.value })}
                required
              >
                <option value="">Select batch</option>
                {batchOptions.map((b) => {
                  const id = b.name ?? b.student_group_name ?? ''
                  return (
                    <option key={id} value={id}>{b.student_group_name ?? b.name}</option>
                  )
                })}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From</Label>
                <Input
                  type="date"
                  value={leaveForm.from_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>To</Label>
                <Input
                  type="date"
                  value={leaveForm.to_date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={applyLeave.isPending}>
              {applyLeave.isPending ? 'Submitting…' : 'Submit Leave Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
