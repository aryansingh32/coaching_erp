"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bell, Search, Settings, Activity, CheckCircle2, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function GlobalNotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  // Mock data for notification logs
  const mockLogs = [
    { id: 'LOG-1', event: 'attendance.rfid_punch', tenant: 'tenant_a', channel: 'SMS', status: 'delivered', time: '2 mins ago' },
    { id: 'LOG-2', event: 'fee.reminder', tenant: 'tenant_b', channel: 'Email', status: 'delivered', time: '5 mins ago' },
    { id: 'LOG-3', event: 'attendance.rfid_punch', tenant: 'tenant_a', channel: 'Push', status: 'failed', time: '12 mins ago' },
    { id: 'LOG-4', event: 'live_class.started', tenant: 'tenant_c', channel: 'Push', status: 'delivered', time: '1 hour ago' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Notification Center</h3>
          <p className="text-muted-foreground">Monitor Novu event streams and global delivery logs.</p>
        </div>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Novu Dashboard
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Delivered (24h)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14,239</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Failed (24h)</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Queue Status</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground mt-1">NATS JetStream connection active</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-institute-border shadow-sm">
        <CardHeader className="py-4">
          <CardTitle>Delivery Logs</CardTitle>
          <CardDescription>Real-time stream of notifications dispatched by the novu-worker.</CardDescription>
          <div className="flex items-center w-full max-w-sm relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by event or tenant..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Event Trigger</TableHead>
                <TableHead>Tenant ID</TableHead>
                <TableHead className="text-center">Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.id}</TableCell>
                  <TableCell className="font-medium text-sm">{log.event}</TableCell>
                  <TableCell className="font-mono text-xs">{log.tenant}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                      {log.channel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${log.status === 'delivered' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{log.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
