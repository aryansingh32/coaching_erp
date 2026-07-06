"use client"

import { useState, useMemo } from "react"
import { Search, IndianRupee, AlertCircle, CheckCircle2, Download, BellRing, Wallet } from "lucide-react"
import { useStudents, usePendingFees, usePaymentHistory, useSendBulkReminders } from "@/lib/api/hooks"
import { useKpis } from "@/lib/api/hooks"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { CollectPaymentModal } from "@/components/finance/collect-payment-modal"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import type { PaymentTransaction } from "@/lib/api/types"
import { Badge } from "@/components/ui/badge"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
}

export default function FinancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null)
  
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false)
  const [defaultAmount, setDefaultAmount] = useState<number>()
  
  const tenantId = useAuthStore((s) => s.tenantId) ?? undefined

  const { data: kpis, isLoading: kpisLoading } = useKpis(tenantId)
  const { data: students, isLoading: studentsLoading, isError, refetch } = useStudents()
  const { data: pendingFees, isLoading: feesLoading } = usePendingFees(selectedStudentId ?? '')
  const { data: paymentHistory, isLoading: historyLoading } = usePaymentHistory(selectedStudentId ?? undefined)
  const bulkReminders = useSendBulkReminders()

  const filteredStudents = (students ?? []).filter((s) => {
    const name = `${s.first_name} ${s.last_name ?? ''}`.toLowerCase()
    return name.includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalPending = pendingFees?.reduce((sum, f) => sum + f.amount, 0) ?? 0

  const handleSendBulkReminders = async () => {
    const ids = filteredStudents.map(s => s.name)
    if (ids.length === 0) return
    try {
      await bulkReminders.mutateAsync(ids)
      toast.success(`Reminders sent to ${ids.length} students`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reminders')
    }
  }

  const historyColumns = useMemo<ColumnDef<PaymentTransaction>[]>(() => [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString()
    },
    {
      accessorKey: "payment_mode",
      header: "Mode",
    },
    {
      accessorKey: "reference_no",
      header: "Ref No.",
      cell: ({ row }) => row.original.reference_no || '-'
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.amount)}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'Completed' ? 'default' : 'secondary'} className={row.original.status === 'Completed' ? 'bg-green-500 hover:bg-green-600' : ''}>
          {row.original.status}
        </Badge>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        row.original.status === 'Completed' && (
          <Button variant="ghost" size="sm" onClick={() => toast.success("Receipt downloaded")}>
            <Download className="w-4 h-4 mr-2" /> Receipt
          </Button>
        )
      )
    }
  ], [])

  if (studentsLoading || kpisLoading) return <LoadingState message="Loading finance data..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Finance & Fees</h3>
          <p className="text-muted-foreground">Fee schedules and collections via ERPNext + Razorpay.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSendBulkReminders} disabled={bulkReminders.isPending}>
            <BellRing className="w-4 h-4 mr-2" />
            Send Reminders
          </Button>
          <Button onClick={() => { setDefaultAmount(totalPending); setIsCollectModalOpen(true); }} disabled={!selectedStudentId}>
            <Wallet className="w-4 h-4 mr-2" />
            Collect Offline Payment
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Collection</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-success">
              {formatCurrency(kpis?.revenueMonthly ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Student Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-institute-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-warning">
              {selectedStudentId ? formatCurrency(totalPending) : '—'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-institute-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        {/* Sidebar: Student List */}
        <Card className="col-span-12 md:col-span-4 border-institute-border shadow-sm flex flex-col h-[600px]">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle>Students</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="divide-y border-t">
              {filteredStudents.map((s) => {
                const isSelected = selectedStudentId === s.name
                const studentName = `${s.first_name} ${s.last_name ?? ''}`
                return (
                  <button
                    key={s.name}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                    onClick={() => {
                      setSelectedStudentId(s.name)
                      setSelectedStudentName(studentName)
                    }}
                  >
                    <span className="font-medium text-sm">{studentName}</span>
                    <span className="text-xs text-muted-foreground font-mono">{s.name}</span>
                  </button>
                )
              })}
              {filteredStudents.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">No students found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Panel: Pending Fees & Payment History */}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-6 h-[600px] overflow-y-auto pr-2">
          {!selectedStudentId ? (
            <Card className="flex-1 flex items-center justify-center border-dashed shadow-sm">
              <EmptyState title="Select a student" description="Choose a student from the sidebar to view their financial records." />
            </Card>
          ) : (
            <>
              {/* Pending Fees */}
              <Card className="shadow-sm shrink-0">
                <CardHeader>
                  <CardTitle>Pending Installments</CardTitle>
                </CardHeader>
                <CardContent>
                  {feesLoading ? (
                    <LoadingState message="Loading fees..." />
                  ) : !pendingFees?.length ? (
                    <EmptyState title="No pending fees" description="This student is fully paid." />
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="h-10 px-4 text-left font-medium">Fee ID</th>
                            <th className="h-10 px-4 text-left font-medium">Due Date</th>
                            <th className="h-10 px-4 text-right font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingFees.map((fee) => (
                            <tr key={fee.fee_id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="p-4 font-mono text-xs">{fee.fee_id}</td>
                              <td className="p-4">{fee.due_date}</td>
                              <td className="p-4 text-right font-medium text-destructive">{formatCurrency(fee.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card className="shadow-sm flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {historyLoading ? (
                    <LoadingState message="Loading history..." />
                  ) : (
                    <DataTable 
                      columns={historyColumns} 
                      data={paymentHistory || []} 
                      searchKey="reference_no" 
                    />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {selectedStudentId && (
        <CollectPaymentModal
          isOpen={isCollectModalOpen}
          onClose={() => setIsCollectModalOpen(false)}
          studentId={selectedStudentId}
          studentName={selectedStudentName || ''}
          defaultAmount={defaultAmount}
        />
      )}
    </div>
  )
}
