"use client"

import { use } from "react"
import Link from "next/link"
import { useTenant, useUpdateTenant, useTenantMetrics, useSuspendTenant } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { toast } from "sonner"

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: tenant, isLoading, isError, refetch } = useTenant(id)
  const { data: metrics } = useTenantMetrics(id)
  const updateTenant = useUpdateTenant()
  const suspendTenant = useSuspendTenant()

  const m = metrics as { students?: number; batches?: number; recentActivity?: unknown[] } | undefined

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      await updateTenant.mutateAsync({ id, data: { name: form.get('name') as string } })
      toast.success('Tenant updated')
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Update failed')
    }
  }

  const handleSuspend = async () => {
    try {
      await suspendTenant.mutateAsync(id)
      toast.success('Tenant suspended')
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Suspend failed')
    }
  }

  if (isLoading) return <LoadingState />
  if (isError || !tenant) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold">{tenant.name}</h3>
          <p className="text-muted-foreground font-mono text-sm">{tenant.id}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleSuspend} disabled={suspendTenant.isPending}>
          Suspend
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader><CardTitle className="text-sm">Students</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{m?.students ?? '—'}</div></CardContent>
        </Card>
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader><CardTitle className="text-sm">Batches</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{m?.batches ?? '—'}</div></CardContent>
        </Card>
      </div>

      <Card className="bg-platform-surface border-platform-border">
        <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <Input name="name" defaultValue={tenant.name} required />
            <Button type="submit" disabled={updateTenant.isPending}>Save</Button>
          </form>
          <Button variant="outline" asChild>
            <Link href={`/superadmin/tenants/${id}/features`}>Manage feature flags</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
