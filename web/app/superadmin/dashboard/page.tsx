'use client'

import Link from 'next/link'
import {
  Building2, Users, Activity, AlertTriangle, Server,
  Zap, Shield, BarChart3, ChevronRight,
} from 'lucide-react'
import { usePlatformStats, useTenants } from '@/lib/api/hooks'
import { KPICard } from '@/components/ui/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/loading-state'
import { ErrorState } from '@/components/shared/error-state'

const QUICK_ACTIONS = [
  { label: 'Manage Tenants', href: '/superadmin/tenants', icon: Building2 },
  { label: 'Plans & Features', href: '/superadmin/plans', icon: BarChart3 },
  { label: 'Audit Logs', href: '/superadmin/audit-logs', icon: Shield },
  { label: 'System Health', href: '/superadmin/health', icon: Activity },
  { label: 'API Explorer', href: '/superadmin/proxy', icon: Zap },
]

export default function SuperAdminDashboard() {
  const { data: stats, isLoading, isError, refetch } = usePlatformStats()
  const { data: tenants } = useTenants()

  if (isLoading) return <LoadingState message="Loading command center…" />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const s = stats as Record<string, number> | undefined

  const tenantCount = s?.tenantCount ?? tenants?.length ?? 0
  const totalStudents = s?.totalStudents ?? 0
  const requests24h = s?.last24hRequests ?? 0
  const errors24h = s?.last24hErrors ?? 0

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Platform Command Center
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitoring <strong className="text-platform-accent">{tenantCount}</strong> institutes
          and <strong className="text-platform-accent">{totalStudents.toLocaleString()}</strong> students
          across all tenants.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          label="Platform MRR"
          value={`₹${(s?.totalMRR ?? (totalStudents * 1000)).toLocaleString('en-IN')}`}
          icon={<BarChart3 className="w-5 h-5 text-green-400" />}
          subLabel="cross-tenant"
          variant="platform"
        />
        <KPICard
          label="Active Tenants"
          value={tenantCount}
          icon={<Building2 className="w-5 h-5 text-platform-accent" />}
          subLabel="institutes"
          variant="platform"
        />
        <KPICard
          label="Total Students"
          value={totalStudents.toLocaleString()}
          icon={<Users className="w-5 h-5 text-blue-400" />}
          subLabel="enrolled"
          variant="platform"
        />
        <KPICard
          label="Requests (24h)"
          value={requests24h.toLocaleString()}
          icon={<Server className="w-5 h-5 text-green-400" />}
          trend={0}
          subLabel="gateway calls"
          variant="platform"
        />
        <KPICard
          label="Errors (24h)"
          value={errors24h}
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          trend={errors24h > 0 ? -1 : 0}
          subLabel={errors24h > 0 ? `${errors24h} errors` : 'all clear'}
          variant={errors24h > 0 ? 'danger' : 'platform'}
        />
      </div>

      {/* Two-column cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-platform-accent" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-platform-elevated transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <action.icon className="w-4 h-4 text-platform-accent" />
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-platform-accent transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recent Tenants */}
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-platform-accent" />
              Recent Tenants
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-platform-accent hover:text-platform-accent">
              <Link href="/superadmin/tenants">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-0">
            {(tenants ?? []).slice(0, 6).map((t) => (
              <Link
                key={t.id}
                href={`/superadmin/tenants/${t.id}`}
                className="flex items-center justify-between py-3 border-b border-platform-border last:border-0 hover:text-platform-accent transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-platform-accent/15 flex items-center justify-center text-platform-accent text-xs font-bold shrink-0">
                    {t.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={t.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {t.status ?? 'active'}
                  </Badge>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-platform-accent" />
                </div>
              </Link>
            ))}
            {!tenants?.length && (
              <p className="text-muted-foreground text-sm text-center py-6">No tenants yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
