"use client"

import { Building2, Users, Server, AlertTriangle, Activity } from "lucide-react"
import { usePlatformStats, useTenants } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SuperAdminDashboard() {
  const { data: stats, isLoading, isError, refetch } = usePlatformStats()
  const { data: tenants } = useTenants()

  if (isLoading) return <LoadingState message="Loading platform command center..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const s = stats as Record<string, number> | undefined

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Command Center</h1>
        <p className="text-muted-foreground mt-1">
          Monitor {s?.tenantCount ?? tenants?.length ?? 0} institutes, {(s?.totalStudents ?? 0).toLocaleString()} students, and all system activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Active Tenants</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{s?.tenantCount ?? 0}</div></CardContent>
        </Card>
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Students</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{s?.totalStudents ?? 0}</div></CardContent>
        </Card>
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Requests (24h)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{s?.last24hRequests ?? 0}</div></CardContent>
        </Card>
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader className="pb-2 flex flex-row justify-between">
            <CardTitle className="text-sm">Errors (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-platform-danger" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-platform-danger">{s?.last24hErrors ?? 0}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/superadmin/tenants">Manage Tenants</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/superadmin/audit-logs">View Audit Logs</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/superadmin/health">System Health</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/superadmin/proxy">API Explorer</Link></Button>
          </CardContent>
        </Card>
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader><CardTitle>Recent Tenants</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(tenants ?? []).slice(0, 5).map((t) => (
              <Link key={t.id} href={`/superadmin/tenants/${t.id}`} className="flex justify-between py-2 border-b border-platform-border last:border-0 hover:text-platform-accent">
                <span>{t.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{t.id.slice(0, 8)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
