"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Loader2 } from "lucide-react"
import { getDashboardEmbed } from "@/lib/api/services"
import { useAuthStore } from "@/lib/stores/auth-store"

export function MetabaseEmbed({ dashboardId }: { dashboardId?: string }) {
  const tenantId = useAuthStore((state) => state.tenantId)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dashboardId) return

    const loadDashboard = async () => {
      try {
        setIsLoading(true)
        const response = await getDashboardEmbed(Number(dashboardId), tenantId)
        setEmbedUrl(response.url)
        setError(null)
      } catch (err) {
        console.error('Failed to load dashboard:', err)
        setError('Failed to load dashboard. Please check your connection.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [dashboardId, tenantId])

  if (isLoading) {
    return (
      <Card className="w-full h-full min-h-[400px] border-dashed bg-muted/20 flex flex-col items-center justify-center">
        <CardContent className="flex flex-col items-center justify-center text-center space-y-4 p-6">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !embedUrl) {
    return (
      <Card className="w-full h-full min-h-[400px] border-dashed bg-muted/20 flex flex-col items-center justify-center">
        <CardContent className="flex flex-col items-center justify-center text-center space-y-4 p-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Metabase Analytics</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
              {error || `The Metabase dashboard connection is pending. Once configured in the Gateway, 
              the real iframe for dashboard <code className="bg-muted px-1 rounded">${dashboardId || 'unknown'}</code> will render here.`}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full h-full min-h-[400px] overflow-hidden">
      <CardContent className="p-0 h-full">
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          title="Metabase Dashboard"
          allowFullScreen
        />
      </CardContent>
    </Card>
  )
}
