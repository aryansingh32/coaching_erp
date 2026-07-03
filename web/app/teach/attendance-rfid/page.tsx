"use client"

import { useMemo, useState } from "react"
import { useBatches, useAttendanceReports } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import type { Batch } from "@/lib/api/types"

export default function TeachRfidAttendancePage() {
  const { data: batches, isLoading } = useBatches()
  const [batchId, setBatchId] = useState('')
  const { startDate, endDate } = useMemo(() => {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 7)
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }
  }, [])
  const { data: reports, isLoading: rLoading } = useAttendanceReports(batchId, startDate, endDate)

  if (isLoading) return <LoadingState />

  const batchList = (batches as Batch[]) ?? []

  return (
    <FeatureGate feature="attendance_rfid">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold">RFID Live Feed</h3>
          <p className="text-muted-foreground">Read-only attendance reports for your batch (subset of institute feed).</p>
        </div>
        <Select value={batchId} onValueChange={setBatchId}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Select batch" />
          </SelectTrigger>
          <SelectContent>
            {batchList.map((b) => {
              const id = b.name ?? b.student_group_name ?? ''
              return (
                <SelectItem key={id} value={id}>{b.student_group_name ?? b.name}</SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {!batchId ? (
          <EmptyState title="Select a batch" />
        ) : rLoading ? (
          <LoadingState />
        ) : (
          <Card>
            <CardHeader><CardTitle>Last 7 days</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(reports, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  )
}
