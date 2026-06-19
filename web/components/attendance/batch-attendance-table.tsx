"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { useAttendanceReports } from "@/lib/api/hooks"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"

interface BatchAttendanceTableProps {
  batchId: string
  startDate: string
  endDate: string
}

export function BatchAttendanceTable({ batchId, startDate, endDate }: BatchAttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: reports, isLoading } = useAttendanceReports(batchId, startDate, endDate)

  const filtered = (reports ?? []).filter((r) =>
    r.date.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) return <LoadingState message="Loading attendance reports..." />

  return (
    <Card className="border-institute-border shadow-sm">
      <CardHeader>
        <CardTitle>Attendance Reports — {batchId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full sm:max-w-sm mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by date..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {!filtered.length ? (
          <EmptyState title="No reports" description="No attendance data for this date range." />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Late</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-institute-success/10 text-institute-success">
                        {row.present}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-institute-danger/10 text-institute-danger">
                        {row.absent}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.late ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
