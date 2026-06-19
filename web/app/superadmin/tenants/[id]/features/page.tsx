"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { useFeatureCatalog, useTenantFeatures, useUpdateTenantFeatures } from "@/lib/api/hooks"
import { LoadingState } from "@/components/shared/loading-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

export default function TenantFeaturesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: catalog, isLoading: catalogLoading } = useFeatureCatalog()
  const { data: tenantFeatures, isLoading, refetch } = useTenantFeatures(id)
  const updateFeatures = useUpdateTenantFeatures()
  const [local, setLocal] = useState<Record<string, boolean> | null>(null)

  const resolved = useMemo(() => {
    const base = (tenantFeatures as { resolved?: Record<string, boolean> })?.resolved ?? {}
    return local ?? base
  }, [tenantFeatures, local])

  const grouped = useMemo(() => {
    const items = (catalog as { key: string; label: string; category: string; description: string }[]) ?? []
    return items.reduce<Record<string, typeof items>>((acc, f) => {
      acc[f.category] = acc[f.category] ?? []
      acc[f.category].push(f)
      return acc
    }, {})
  }, [catalog])

  const handleToggle = (key: string, enabled: boolean) => {
    setLocal((prev) => ({ ...(prev ?? resolved), [key]: enabled }))
  }

  const handleSave = async () => {
    if (!local) return
    try {
      await updateFeatures.mutateAsync({ tenantId: id, features: local })
      toast.success("Features updated")
      setLocal(null)
      refetch()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Update failed")
    }
  }

  if (isLoading || catalogLoading) return <LoadingState />

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/superadmin/tenants/${id}`}><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h3 className="text-2xl font-bold">Feature Controls</h3>
          <p className="text-muted-foreground text-sm font-mono">{id}</p>
        </div>
      </div>

      {Object.entries(grouped).map(([category, features]) => (
        <Card key={category} className="bg-platform-surface border-platform-border">
          <CardHeader>
            <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {features.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-4 py-2 border-b border-platform-border last:border-0">
                <div>
                  <p className="font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={resolved[f.key] ? 'default' : 'secondary'}>
                    {resolved[f.key] ? 'On' : 'Off'}
                  </Badge>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={resolved[f.key] === true}
                      onChange={(e) => handleToggle(f.key, e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleSave} disabled={!local || updateFeatures.isPending}>
        Save feature overrides
      </Button>
    </div>
  )
}
