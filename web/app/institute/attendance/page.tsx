"use client"

import { useState } from "react"
import { format, subDays } from "date-fns"
import { Users, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { useBatches, useAttendanceReports } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LiveFeedLog } from "@/components/attendance/live-feed-log"
import { BatchAttendanceTable } from "@/components/attendance/batch-attendance-table"
import { LoadingState } from "@/components/shared/loading-state"
import type { Batch } from "@/lib/api/types"

function getBatchId(batch: Batch) {
  return batch.id ?? batch.name ?? batch.student_group_name ?? ''
}

export default function LiveAttendanceBoard() {
  const { data: batches, isLoading } = useBatches()
  const [selectedBatch, setSelectedBatch] = useState<string>('')

  const batchId = selectedBatch || (batches?.[0] ? getBatchId(batches[0]) : '')
  const today = format(new Date(), 'yyyy-MM-dd')
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd')

  const { data: reports } = useAttendanceReports(batchId, weekAgo, today)

  const latestReport = reports?.[reports.length - 1]
  const stats = {
    total: (latestReport?.present ?? 0) + (latestReport?.absent ?? 0),
    present: latestReport?.present ?? 0,
    late: latestReport?.late ?? 0,
    absent: latestReport?.absent ?? 0,
  }

  if (isLoading) return <LoadingState message="Loading attendance center..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Attendance Center</h3>
          <p className="text-muted-foreground">Real-time punches and attendance reports from the gateway.</p>
        </div>
        {batches && batches.length > 0 && (
          <Select value={batchId} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => {
                const id = getBatchId(b)
                return (
                  <SelectItem key={id} value={id}>
                    {b.student_group_name ?? b.name ?? id}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total (Latest)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-institute-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-success">{stats.present}</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-institute-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-warning">{stats.late}</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-institute-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-danger">{stats.absent}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="live-feed" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="live-feed">Live Feed</TabsTrigger>
          <TabsTrigger value="search">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="live-feed" className="space-y-6">
          <Card className="border-institute-border shadow-sm">
            <CardHeader>
              <CardTitle>Attendance Activity Feed</CardTitle>
              <CardDescription>WebSocket stream from gateway /attendance namespace.</CardDescription>
            </CardHeader>
            <CardContent>
              <LiveFeedLog batchId={batchId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <BatchAttendanceTable batchId={batchId} startDate={weekAgo} endDate={today} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
