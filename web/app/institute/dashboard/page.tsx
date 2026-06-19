"use client"

import { useQuery } from "@tanstack/react-query"
import { Users, GraduationCap, DollarSign, Activity } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressRing } from "@/components/shared/progress-ring"

// Mock the API structure based on the research report
interface KPIResponse {
  success: boolean
  data: {
    totalStudents: number
    activeBatches: number
    revenueMonthly: number
    attendanceToday: number // Percentage
  }
}

export default function InstituteDashboard() {
  const { data, isLoading } = useQuery<KPIResponse>({
    queryKey: ["analytics", "kpis"],
    queryFn: () => apiClient.get("/analytics/kpis"),
  })

  // Fallback mock data in case the gateway isn't running
  const kpis = data?.data || {
    totalStudents: 1248,
    activeBatches: 42,
    revenueMonthly: 425000,
    attendanceToday: 86,
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-institute-text-primary">Overview</h3>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening at your institute today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : kpis.totalStudents}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : kpis.activeBatches}</div>
            <p className="text-xs text-muted-foreground">3 batches starting next week</p>
          </CardContent>
        </Card>

        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-success">
              {isLoading ? "..." : `₹${kpis.revenueMonthly.toLocaleString()}`}
            </div>
            <p className="text-xs text-muted-foreground">₹45,000 pending this month</p>
          </CardContent>
        </Card>

        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Attendance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{isLoading ? "..." : `${kpis.attendanceToday}%`}</div>
              <p className="text-xs text-muted-foreground">24 students absent</p>
            </div>
            {!isLoading && (
              <ProgressRing 
                value={kpis.attendanceToday} 
                size="sm" 
                color={kpis.attendanceToday > 80 ? "success" : "warning"} 
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-4 border-institute-border shadow-sm">
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed border-institute-border mt-4">
            {/* Metabase embedded chart will go here */}
            <p className="text-muted-foreground text-sm">Analytics Chart Placeholder</p>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-institute-border shadow-sm">
          <CardHeader>
            <CardTitle>Recent RFID Punches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mr-3">
                    <span className="text-xs font-medium">S{i}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Student Name {i}</p>
                    <p className="text-xs text-muted-foreground">JEE Mains Target Batch</p>
                  </div>
                  <div className="text-xs text-institute-success font-medium">08:{15 + i} AM</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
