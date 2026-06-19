"use client"

import { useReadiness, useHealth } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"

function StatusBadge({ status }: { status?: string }) {
  const isUp = status === 'up' || status === 'ok'
  return (
    <Badge
      variant="outline"
      className={isUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}
    >
      {status ?? 'unknown'}
    </Badge>
  )
}

export default function HealthPage() {
  const { data: liveness, isLoading: l1, isError: e1, refetch: r1 } = useHealth()
  const { data: readiness, isLoading: l2, isError: e2, refetch: r2 } = useReadiness()

  if (l1 || l2) return <LoadingState message="Checking system health..." />
  if (e1 || e2) return <ErrorState onRetry={() => { r1(); r2() }} />

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">System Health</h3>
        <p className="text-muted-foreground">Live status of all backend services.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader>
            <CardTitle>API Gateway</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={liveness?.status} />
            {liveness?.timestamp && (
              <p className="text-xs text-muted-foreground mt-2">
                Last check: {new Date(liveness.timestamp).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-platform-surface border-platform-border">
          <CardHeader>
            <CardTitle>Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={readiness?.status} />
          </CardContent>
        </Card>
      </div>

      {readiness?.details && (
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader>
            <CardTitle>Service Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(readiness.details).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between py-2 border-b border-platform-border last:border-0">
                  <span className="font-medium capitalize">{service}</span>
                  <StatusBadge status={status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
