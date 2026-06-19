"use client"

import { Users, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LiveFeedLog } from "@/components/attendance/live-feed-log"
import { AttendanceMap } from "@/components/attendance/attendance-map"
import { BatchAttendanceTable } from "@/components/attendance/batch-attendance-table"

export default function LiveAttendanceBoard() {
  const selectedBatch = "BCH-A-24" // Default selected batch for now

  // Example stats (would be derived from API in full implementation)
  const stats = {
    total: 120,
    present: 94,
    late: 12,
    absent: 14,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-institute-text-primary">Attendance Center</h3>
          <p className="text-muted-foreground">Monitor real-time punches, analyze trends, and search records.</p>
        </div>
      </div>

      {/* KPI Stats remain outside tabs to provide persistent context */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campus Strength</CardTitle>
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
          <TabsTrigger value="analytics">Map & Analytics</TabsTrigger>
          <TabsTrigger value="search">Student Search</TabsTrigger>
        </TabsList>

        <TabsContent value="live-feed" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 border-institute-border shadow-sm">
              <CardHeader>
                <CardTitle>Attendance Activity Feed</CardTitle>
                <CardDescription>Real-time log of student punches across all campus gates.</CardDescription>
              </CardHeader>
              <CardContent>
                <LiveFeedLog selectedBatch={selectedBatch} />
              </CardContent>
            </Card>

            {/* Re-use the existing System Status card here but cleaned up */}
            <Card className="border-institute-border shadow-sm h-fit">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Main Gate RFID</span>
                    <span className="w-2 h-2 rounded-full bg-institute-success animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Library RFID</span>
                    <span className="w-2 h-2 rounded-full bg-institute-success animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hostel Biometric</span>
                    <span className="w-2 h-2 rounded-full bg-institute-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AttendanceMap />
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-institute-border shadow-sm">
              <CardHeader>
                <CardTitle>Peak Attendance Days</CardTitle>
                <CardDescription>Highest turnouts this month</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-48 text-muted-foreground bg-muted/10 rounded-md">
                (Bar Chart Visualization)
              </CardContent>
            </Card>
            <Card className="border-institute-border shadow-sm">
              <CardHeader>
                <CardTitle>Late Arrivals by Batch</CardTitle>
                <CardDescription>Distribution of delayed entry</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-48 text-muted-foreground bg-muted/10 rounded-md">
                (Pie Chart Visualization)
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="search" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <BatchAttendanceTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
