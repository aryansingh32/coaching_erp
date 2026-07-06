"use client"

import { useKpis, useDashboardEmbed } from "@/lib/api/hooks"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Users, GraduationCap, DollarSign, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressRing } from "@/components/shared/progress-ring"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { LiveFeedLog } from "@/components/attendance/live-feed-log"
import { KPICard } from "@/components/ui/kpi-card"

const DASHBOARD_ID = parseInt(process.env.NEXT_PUBLIC_METABASE_DASHBOARD_ID || '1', 10)

export default function InstituteDashboard() {
  const tenantId = useAuthStore((s) => s.tenantId) ?? undefined
  const { data: kpis, isLoading, isError, refetch } = useKpis(tenantId)
  const { data: dashboard } = useDashboardEmbed(DASHBOARD_ID, tenantId)

  if (isLoading) return <LoadingState message="Loading dashboard..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const attendanceToday = kpis?.attendanceToday ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Overview</h3>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening at your institute today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Total Students"
          value={kpis?.totalStudents ?? 0}
          icon={<Users className="h-4 w-4" />}
          loading={isLoading}
        />
        <KPICard
          label="Active Batches"
          value={kpis?.activeBatches ?? 0}
          icon={<GraduationCap className="h-4 w-4" />}
          loading={isLoading}
        />
        <KPICard
          label="Monthly Collection"
          value={`₹${(kpis?.revenueMonthly ?? 0).toLocaleString('en-IN')}`}
          icon={<DollarSign className="h-4 w-4" />}
          variant="success"
          loading={isLoading}
        />
        <KPICard
          label="Today's Attendance"
          value={attendanceToday > 0 ? `${attendanceToday}%` : '—'}
          icon={<Activity className="h-4 w-4" />}
          trend={attendanceToday > 0 ? (attendanceToday > 80 ? 1 : -1) : 0}
          subLabel={attendanceToday > 80 ? "On track" : "Needs attention"}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-institute-border shadow-sm">
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dashboard?.url ? (
              <iframe
                src={dashboard.url}
                className="w-full h-full border-0 rounded-md"
                title="Institute Analytics"
              />
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed rounded-md">
                <p className="text-muted-foreground text-sm">Analytics dashboard unavailable</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-institute-border shadow-sm">
          <CardHeader>
            <CardTitle>Recent RFID Punches</CardTitle>
          </CardHeader>
          <CardContent>
            <LiveFeedLog />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
