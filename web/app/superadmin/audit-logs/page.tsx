"use client"

import { useState } from "react"
import { useAuditLogs } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingState } from "@/components/shared/loading-state"

export default function AuditLogsPage() {
  const [instituteFilter, setInstituteFilter] = useState("")
  const { data, isLoading } = useAuditLogs({
    instituteId: instituteFilter || undefined,
    limit: 200,
  })

  if (isLoading) return <LoadingState />

  const items = (data?.items ?? []) as Array<{
    id: string
    action: string
    resource: string
    user_id: string
    institute_id: string | null
    status: string
    duration_ms?: number
    timestamp: string
    error?: string
  }>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Every write operation and admin action across all institutes ({data?.total ?? 0} records).</p>
      </div>
      <Input
        placeholder="Filter by institute ID..."
        value={instituteFilter}
        onChange={(e) => setInstituteFilter(e.target.value)}
        className="max-w-sm"
      />
      <Card className="bg-platform-surface border-platform-border">
        <CardHeader><CardTitle>Activity Stream</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Institute</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ms</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate">{log.resource}</TableCell>
                  <TableCell className="font-mono text-xs">{log.user_id}</TableCell>
                  <TableCell className="font-mono text-xs">{log.institute_id ?? '—'}</TableCell>
                  <TableCell>
                    <Badge className={log.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{log.duration_ms ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
