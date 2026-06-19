"use client"

import { useState } from "react"
import { Search, IndianRupee, AlertCircle, CheckCircle2 } from "lucide-react"
import { useStudents, usePendingFees } from "@/lib/api/hooks"
import { useKpis } from "@/lib/api/hooks"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
}

export default function FinancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const tenantId = useAuthStore((s) => s.tenantId) ?? undefined

  const { data: kpis, isLoading: kpisLoading } = useKpis(tenantId)
  const { data: students, isLoading: studentsLoading, isError, refetch } = useStudents()
  const { data: pendingFees, isLoading: feesLoading } = usePendingFees(selectedStudentId ?? '')

  const filteredStudents = (students ?? []).filter((s) => {
    const name = `${s.first_name} ${s.last_name ?? ''}`.toLowerCase()
    return name.includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalPending = pendingFees?.reduce((sum, f) => sum + f.amount, 0) ?? 0

  if (studentsLoading || kpisLoading) return <LoadingState message="Loading finance data..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Finance & Fees</h3>
        <p className="text-muted-foreground">Fee schedules and collections via ERPNext + Razorpay.</p>
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

      <Card className="border-institute-border shadow-sm">
        <CardHeader>
          <CardTitle>Pending Fees by Student</CardTitle>
          <CardDescription>Select a student to view pending fee installments from GET /fees/pending/:studentId</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-md border max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">
                        {s.first_name} {s.last_name ?? ''}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={selectedStudentId === s.name ? 'default' : 'outline'}
                          onClick={() => setSelectedStudentId(s.name)}
                        >
                          View Fees
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              {!selectedStudentId ? (
                <EmptyState title="Select a student" description="Choose a student to load their pending fees." />
              ) : feesLoading ? (
                <LoadingState message="Loading fees..." />
              ) : !pendingFees?.length ? (
                <EmptyState title="No pending fees" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee ID</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingFees.map((fee) => (
                      <TableRow key={fee.fee_id}>
                        <TableCell className="font-mono text-xs">{fee.fee_id}</TableCell>
                        <TableCell>{fee.due_date}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(fee.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
