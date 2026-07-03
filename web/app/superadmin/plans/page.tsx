"use client"

import { useState } from "react"
import Link from "next/link"
import { useTenants, useFeatureCatalog, useTenantFeatures, useUpdateTenantFeatures } from "@/lib/api/hooks"
import { LoadingState } from "@/components/shared/loading-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ExternalLink } from "lucide-react"

const CATEGORIES = ['core', 'academics', 'finance', 'communication', 'analytics', 'integrations'] as const

export default function PlansPage() {
  const { data: tenants, isLoading: tenantsLoading } = useTenants()
  const { data: catalog, isLoading: catalogLoading } = useFeatureCatalog()
  const [selectedTenant, setSelectedTenant] = useState('')
  const tenantId = selectedTenant || (tenants?.[0]?.id ?? '')

  const { data: tenantFeatures, isLoading: featuresLoading, refetch } = useTenantFeatures(tenantId)
  const updateFeatures = useUpdateTenantFeatures()
  const [local, setLocal] = useState<Record<string, boolean> | null>(null)

  const resolved = local ?? (tenantFeatures as { resolved?: Record<string, boolean> })?.resolved ?? {}
  const overrides = (tenantFeatures as { overrides?: Record<string, boolean> })?.overrides ?? {}

  const items = (catalog as { key: string; label: string; description: string; category: string }[]) ?? []

  const handleToggle = (key: string, enabled: boolean) => {
    setLocal((prev) => ({ ...(prev ?? resolved), [key]: enabled }))
  }

  const handleSave = async () => {
    if (!local || !tenantId) return
    try {
      await updateFeatures.mutateAsync({ tenantId, features: local })
      toast.success('Feature overrides saved')
      setLocal(null)
      refetch()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Save failed')
    }
  }

  if (tenantsLoading || catalogLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Plans & Features</h1>
          <p className="text-muted-foreground">
            Manage per-tenant feature flags against the platform catalog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={tenantId} onValueChange={(v) => { setSelectedTenant(v); setLocal(null) }}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select institute" />
            </SelectTrigger>
            <SelectContent>
              {(tenants ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tenantId && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/superadmin/tenants/${tenantId}/features`}>
                <ExternalLink className="w-4 h-4 mr-1" /> Detail view
              </Link>
            </Button>
          )}
        </div>
      </div>

      {featuresLoading ? (
        <LoadingState />
      ) : (
        <Tabs defaultValue="core">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map((cat) => {
            const features = items.filter((f) => f.category === cat)
            return (
              <TabsContent key={cat} value={cat} className="mt-4">
                <Card className="bg-platform-surface border-platform-border">
                  <CardHeader>
                    <CardTitle className="capitalize">{cat}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {features.map((f) => {
                      const isOverride = overrides[f.key] !== undefined
                      return (
                        <div
                          key={f.key}
                          className="flex items-center justify-between gap-4 py-3 border-b border-platform-border last:border-0"
                        >
                          <div>
                            <p className="font-medium">{f.label}</p>
                            <p className="text-xs text-muted-foreground">{f.description}</p>
                            <p className="text-xs font-mono text-muted-foreground mt-1">{f.key}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant={isOverride ? 'default' : 'outline'}>
                              {isOverride ? 'Override' : 'Plan default'}
                            </Badge>
                            <Badge variant={resolved[f.key] ? 'default' : 'secondary'}>
                              {resolved[f.key] ? 'On' : 'Off'}
                            </Badge>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-input"
                                checked={resolved[f.key] === true}
                                onChange={(e) => handleToggle(f.key, e.target.checked)}
                              />
                            </label>
                          </div>
                        </div>
                      )
                    })}
                    {!features.length && (
                      <p className="text-sm text-muted-foreground">No features in this category.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      <Button onClick={handleSave} disabled={!local || updateFeatures.isPending}>
        Save overrides for {tenantId}
      </Button>
    </div>
  )
}
