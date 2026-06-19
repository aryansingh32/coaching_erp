"use client"

import { usePlatformStats } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"

const DASHBOARD_ID = process.env.NEXT_PUBLIC_METABASE_DASHBOARD_ID || '1'

export default function SuperAdminAnalyticsPage() {
  const { data: stats, isLoading } = usePlatformStats()

  if (isLoading) return <LoadingState />

  const byInstitute = (stats as { requestsByInstitute?: Record<string, number> })?.requestsByInstitute ?? {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground">Metabase dashboard ID: {DASHBOARD_ID}</p>
      </div>
      <Card className="bg-platform-surface border-platform-border">
        <CardHeader><CardTitle>Requests by Institute (24h)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(byInstitute).map(([inst, count]) => (
            <div key={inst} className="flex justify-between py-2 border-b border-platform-border">
              <span className="font-mono text-sm">{inst}</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
          {!Object.keys(byInstitute).length && (
            <p className="text-muted-foreground text-sm">No activity in the last 24 hours.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
