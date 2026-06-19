"use client"

import { useState } from "react"
import { Search, IndianRupee, AlertCircle, CheckCircle2, Download, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const MOCK_FEES = [
  { id: "INV-001", student: "Alice Smith", batch: "BCH-A-24", amount: 25000, due: "2024-03-01", status: "Paid" },
  { id: "INV-002", student: "Bob Johnson", batch: "BCH-A-24", amount: 25000, due: "2024-03-01", status: "Overdue" },
  { id: "INV-003", student: "Charlie Williams", batch: "BCH-B-24", amount: 15000, due: "2024-04-15", status: "Pending" },
  { id: "INV-004", student: "David Jones", batch: "BCH-C-24", amount: 10000, due: "2024-02-15", status: "Paid" },
  { id: "INV-005", student: "Eve Brown", batch: "BCH-B-24", amount: 15000, due: "2024-04-15", status: "Pending" },
]

export default function FinancePage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredFees = MOCK_FEES.filter(f => 
    f.student.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-institute-text-primary">Finance & Fees</h3>
          <p className="text-muted-foreground">Track fee collections, manage invoices, and monitor defaulters.</p>
        </div>
        <Button className="bg-institute-primary text-primary-foreground hover:bg-institute-primary/90">
          <Download className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (YTD)</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(4500000)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-institute-success" /> +12% from last year
            </p>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-institute-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-success">{formatCurrency(350000)}</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
            <AlertCircle className="h-4 w-4 text-institute-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-warning">{formatCurrency(120000)}</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Defaulters</CardTitle>
            <AlertCircle className="h-4 w-4 text-institute-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-danger">24 Students</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-institute-border shadow-sm">
        <CardHeader>
          <CardTitle>Fee Installments & Invoices</CardTitle>
          <CardDescription>View upcoming payments and follow up on overdue accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student or invoice ID..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">Filter Status</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-mono text-xs">{fee.id}</TableCell>
                    <TableCell className="font-medium">{fee.student}</TableCell>
                    <TableCell>{fee.batch}</TableCell>
                    <TableCell>{new Date(fee.due).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(fee.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant="outline" 
                        className={
                          fee.status === "Paid" ? "bg-institute-success/10 text-institute-success" : 
                          fee.status === "Pending" ? "bg-institute-warning/10 text-institute-warning" : 
                          "bg-institute-danger/10 text-institute-danger"
                        }
                      >
                        {fee.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
