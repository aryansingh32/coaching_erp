"use client"

import { useLeaveRequests, useUpdateLeaveRequest } from "@/lib/api/hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"
import type { LeaveRequest } from "@/lib/api/types"

export default function LeaveRequestsPage() {
  const { data: requests, isLoading, isError, refetch } = useLeaveRequests()
  const updateLeave = useUpdateLeaveRequest()

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await updateLeave.mutateAsync({ id, status })
      toast.success(`Leave ${status.toLowerCase()}`)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Action failed')
    }
  }

  if (isLoading) return <LoadingState message="Loading leave requests..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const list = (requests ?? []) as LeaveRequest[]
  const pending = list.filter((r) => !r.status || r.status === 'Open' || r.status === 'Pending')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Leave Requests</h3>
        <p className="text-muted-foreground">Approve or reject student leave applications.</p>
      </div>

      {!list.length ? (
        <EmptyState title="No leave requests" description="Requests submitted by students/parents appear here." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((req) => (
                  <TableRow key={req.name}>
                    <TableCell className="font-mono text-xs">{req.student}</TableCell>
                    <TableCell>{req.student_group ?? '—'}</TableCell>
                    <TableCell>{req.from_date}</TableCell>
                    <TableCell>{req.to_date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.reason ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={req.status === 'Approved' ? 'default' : req.status === 'Rejected' ? 'destructive' : 'secondary'}>
                        {req.status ?? 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {(!req.status || req.status === 'Open' || req.status === 'Pending') && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateLeave.isPending}
                            onClick={() => handleAction(req.name, 'Approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={updateLeave.isPending}
                            onClick={() => handleAction(req.name, 'Rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <p className="text-sm text-muted-foreground">{pending.length} request(s) awaiting review.</p>
      )}
    </div>
  )
}
