"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Search, Settings, Activity, CheckCircle2, XCircle, LayoutTemplate } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotificationLogs } from "@/lib/api/hooks"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"

export default function GlobalNotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: logs, isLoading, isError, refetch } = useNotificationLogs()

  // Use environment variable for the Novu dashboard URL, default to standard Novu web UI
  const novuDashboardUrl = process.env.NEXT_PUBLIC_NOVU_DASHBOARD_URL || "https://web.novu.co"

  const filteredLogs = logs?.filter(log => 
    log.event.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.tenant.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? []

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Notification Center</h3>
          <p className="text-muted-foreground">Manage Novu workflows and global delivery logs.</p>
        </div>
      </div>

      <Tabs defaultValue="logs" className="flex-1 flex flex-col space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="logs"><Activity className="w-4 h-4 mr-2" /> Delivery Logs</TabsTrigger>
          <TabsTrigger value="workflows"><LayoutTemplate className="w-4 h-4 mr-2" /> Workflows & Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6 m-0">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-institute-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Delivered (24h)</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-muted-foreground">Coming Soon</div>
                <p className="text-xs text-muted-foreground mt-1">Analytics integration pending</p>
              </CardContent>
            </Card>
            <Card className="border-institute-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Failed (24h)</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-muted-foreground">Coming Soon</div>
                <p className="text-xs text-muted-foreground mt-1">Analytics integration pending</p>
              </CardContent>
            </Card>
            <Card className="border-institute-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Queue Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground/50" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-muted-foreground">Coming Soon</div>
                <p className="text-xs text-muted-foreground mt-1">Monitoring integration pending</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-institute-border shadow-sm flex-1">
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
              {isLoading ? (
                <LoadingState />
              ) : isError ? (
                <ErrorState onRetry={() => refetch()} />
              ) : (
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
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No delivery logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
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
                          <TableCell className="text-right text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="flex-1 m-0">
          <Card className="border-institute-border shadow-sm h-full flex flex-col min-h-[700px]">
            <CardHeader className="py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workflow & Template Editor</CardTitle>
                  <CardDescription>Design email, SMS, and in-app notification templates via the embedded Novu engine.</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={novuDashboardUrl} target="_blank" rel="noreferrer">
                    <Settings className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <iframe 
                src={novuDashboardUrl} 
                className="w-full h-full min-h-[700px] border-0"
                title="Novu Workflow Editor"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
