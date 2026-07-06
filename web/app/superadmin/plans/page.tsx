'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  useTenants,
  useFeatureCatalog,
  useTenantFeatures,
  useUpdateTenantFeatures,
} from '@/lib/api/hooks'
import { LoadingState } from '@/components/shared/loading-state'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ExternalLink, Save, RotateCcw, Layers, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { key: 'core', label: 'Core', color: 'text-blue-500' },
  { key: 'academics', label: 'Academics', color: 'text-purple-500' },
  { key: 'finance', label: 'Finance', color: 'text-green-500' },
  { key: 'communication', label: 'Communication', color: 'text-orange-500' },
  { key: 'analytics', label: 'Analytics', color: 'text-cyan-500' },
  { key: 'integrations', label: 'Integrations', color: 'text-pink-500' },
] as const

const PLAN_TIERS: Record<string, string[]> = {
  student_management: ['starter', 'growth', 'professional'],
  batches: ['starter', 'growth', 'professional'],
  teacher_portal: ['starter', 'growth', 'professional'],
  parent_portal: ['starter', 'growth', 'professional'],
  attendance_manual: ['starter', 'growth', 'professional'],
  schedule: ['starter', 'growth', 'professional'],
  fees_management: ['starter', 'growth', 'professional'],
  attendance_rfid: ['growth', 'professional'],
  grades: ['growth', 'professional'],
  online_payments: ['growth', 'professional'],
  live_classes: ['growth', 'professional'],
  moodle_lms: ['growth', 'professional'],
  online_tests: ['growth', 'professional'],
  analytics: ['growth', 'professional'],
  notifications: ['growth', 'professional'],
  communication: ['growth', 'professional'],
  bulk_import: ['growth', 'professional'],
  custom_branding: ['professional'],
  recordings: ['professional'],
  api_proxy: ['professional'],
}

function getPlanTiers(key: string) {
  return PLAN_TIERS[key] ?? ['professional']
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed',
        checked
          ? 'bg-green-600'
          : 'bg-red-500/70',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

function FeatureRow({
  feature,
  resolved,
  isOverride,
  onToggle,
}: {
  feature: { key: string; label: string; description: string; category: string }
  resolved: boolean
  isOverride: boolean
  onToggle: (key: string, enabled: boolean) => void
}) {
  const tiers = getPlanTiers(feature.key)

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-platform-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="font-medium text-sm">{feature.label}</p>
          <div className="flex gap-1">
            {['starter', 'growth', 'professional'].map((tier) => (
              <span
                key={tier}
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-mono',
                  tiers.includes(tier)
                    ? 'bg-platform-accent/20 text-platform-accent'
                    : 'bg-muted/20 text-muted-foreground/40 line-through',
                )}
              >
                {tier[0].toUpperCase()}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{feature.description}</p>
        <p className="text-xs font-mono text-muted-foreground/60 mt-0.5">{feature.key}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {isOverride ? (
          <Badge variant="default" className="bg-platform-accent/20 text-platform-accent border-platform-accent/30 text-xs">
            Override
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Plan default
          </Badge>
        )}
        {resolved ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground/40" />
        )}
        <ToggleSwitch
          checked={resolved}
          onChange={(v) => onToggle(feature.key, v)}
        />
      </div>
    </div>
  )
}

export default function PlansPage() {
  const { data: tenants, isLoading: tenantsLoading } = useTenants()
  const { data: catalog, isLoading: catalogLoading } = useFeatureCatalog()
  const [selectedTenant, setSelectedTenant] = useState('')
  const tenantId = selectedTenant || (tenants?.[0]?.id ?? '')

  const { data: tenantFeatures, isLoading: featuresLoading, refetch } =
    useTenantFeatures(tenantId)
  const updateFeatures = useUpdateTenantFeatures()
  const [local, setLocal] = useState<Record<string, boolean> | null>(null)

  const resolved =
    local ??
    (tenantFeatures as { resolved?: Record<string, boolean> })?.resolved ??
    {}
  const overrides =
    (tenantFeatures as { overrides?: Record<string, boolean> })?.overrides ?? {}

  const items =
    (catalog as { key: string; label: string; description: string; category: string }[]) ?? []

  const handleToggle = (key: string, enabled: boolean) => {
    setLocal((prev) => ({ ...(prev ?? resolved), [key]: enabled }))
  }

  const handleReset = () => setLocal(null)

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

  const enabledCount = Object.values(resolved).filter(Boolean).length
  const overrideCount = Object.keys(overrides).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="w-7 h-7 text-platform-accent" />
            Plans &amp; Features
          </h1>
          <p className="text-muted-foreground mt-1">
            Per-tenant feature flag matrix. Toggle features and save overrides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={tenantId}
            onValueChange={(v) => {
              setSelectedTenant(v)
              setLocal(null)
            }}
          >
            <SelectTrigger className="w-[220px] bg-platform-surface border-platform-border">
              <SelectValue placeholder="Select institute" />
            </SelectTrigger>
            <SelectContent>
              {(tenants ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tenantId && (
            <Button variant="outline" size="sm" asChild className="border-platform-border">
              <Link href={`/superadmin/tenants/${tenantId}/features`}>
                <ExternalLink className="w-4 h-4 mr-1" />
                Detail
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      {!featuresLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Features enabled', value: enabledCount, color: 'text-green-500' },
            { label: 'Features off', value: items.length - enabledCount, color: 'text-muted-foreground' },
            { label: 'Overrides set', value: overrideCount, color: 'text-platform-accent' },
            { label: 'Unsaved changes', value: local ? Object.keys(local).length : 0, color: 'text-amber-500' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-platform-surface border border-platform-border rounded-lg p-4"
            >
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Feature matrix tabs */}
      {featuresLoading ? (
        <LoadingState />
      ) : (
        <Tabs defaultValue="core">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-platform-surface border border-platform-border p-1">
            {CATEGORIES.map((cat) => {
              const count = items.filter((f) => f.category === cat.key && resolved[f.key]).length
              const total = items.filter((f) => f.category === cat.key).length
              return (
                <TabsTrigger
                  key={cat.key}
                  value={cat.key}
                  className="data-[state=active]:bg-platform-elevated data-[state=active]:text-platform-text"
                >
                  <span className={cn('mr-1.5', cat.color)}>●</span>
                  {cat.label}
                  {total > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs border-platform-border">
                      {count}/{total}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {CATEGORIES.map((cat) => {
            const features = items.filter((f) => f.category === cat.key)
            return (
              <TabsContent key={cat.key} value={cat.key} className="mt-4">
                <Card className="bg-platform-surface border-platform-border">
                  <CardHeader className="border-b border-platform-border py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className={cat.color}>●</span>
                      {cat.label} Features
                      <span className="text-muted-foreground font-normal text-sm">
                        ({features.length} total)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-6">
                    {features.length === 0 ? (
                      <EmptyState title="No features in this category" className="py-8" />
                    ) : (
                      features.map((f) => (
                        <FeatureRow
                          key={f.key}
                          feature={f}
                          resolved={!!resolved[f.key]}
                          isOverride={overrides[f.key] !== undefined}
                          onToggle={handleToggle}
                        />
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      {/* Save / Reset */}
      <div className="flex items-center gap-3 sticky bottom-4">
        <Button
          onClick={handleSave}
          disabled={!local || updateFeatures.isPending}
          className="bg-platform-accent hover:bg-platform-accent/90 text-white"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {updateFeatures.isPending ? 'Saving…' : `Save overrides for ${tenantId || '—'}`}
        </Button>
        {local && (
          <Button variant="outline" onClick={handleReset} className="border-platform-border">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
