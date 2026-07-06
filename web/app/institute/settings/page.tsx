"use client"

import { useState } from "react"
import { Save, Building2, Palette, Globe, CreditCard, Bell } from "lucide-react"
import { useTenant, useUpdateTenant, useSaveRazorpayConfig } from "@/lib/api/hooks"
import { useAuthStore } from "@/lib/stores/auth-store"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingState } from "@/components/shared/loading-state"
import { toast } from "sonner"
import { NotificationPreferences } from "@/components/notifications/notification-preferences"

function hexToHSL(hex: string) {
  let r = 0, g = 0, b = 0
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16) / 255
    g = parseInt(hex.slice(3, 5), 16) / 255
    b = parseInt(hex.slice(5, 7), 16) / 255
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export default function SettingsPage() {
  const tenantId = useAuthStore((s) => s.tenantId) ?? '00000000-0000-0000-0000-000000000001'
  const setBranding = useAuthStore((s) => s.setBranding)
  const { data: tenant, isLoading } = useTenant(tenantId)
  const updateTenant = useUpdateTenant()
  const saveRazorpay = useSaveRazorpayConfig()

  const integrations = (tenant as { integrations?: { razorpay_key_id?: string } })?.integrations

  const [primaryColor, setPrimaryColor] = useState(tenant?.branding?.primaryColor ?? '#1e40af')

  const applyColor = (hex: string) => {
    setPrimaryColor(hex)
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--inst-primary', hexToHSL(hex))
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    try {
      await updateTenant.mutateAsync({
        id: tenantId,
        data: { name, branding: { primaryColor } },
      })
      setBranding({ primaryColor, instituteName: name })
      toast.success('Settings saved')
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message || 'Save failed')
    }
  }

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Platform Settings</h3>
        <p className="text-muted-foreground">Tenant configuration via PUT /tenants/:id</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="general"><Building2 className="w-4 h-4 mr-2" /> General</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="w-4 h-4 mr-2" /> Branding</TabsTrigger>
          <TabsTrigger value="domains"><Globe className="w-4 h-4 mr-2" /> Domains</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className="w-4 h-4 mr-2" /> Payments</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" /> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>General Profile</CardTitle>
              <CardDescription>Synced from tenant record.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4" key={tenant?.name}>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Institute Name</label>
                  <Input name="name" defaultValue={tenant?.name ?? ''} required />
                </div>
                <Button type="submit" disabled={updateTenant.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateTenant.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>White-Label Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <input type="hidden" name="name" value={tenant?.name ?? ''} />
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => applyColor(e.target.value)}
                    className="w-16 h-12 p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => applyColor(e.target.value)}
                    className="w-32 font-mono uppercase"
                  />
                </div>
                <Button type="submit" disabled={updateTenant.isPending}>Save Branding</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Tenant ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm">{tenantId}</p>
              <Badge variant="outline" className="mt-2 capitalize">
                {tenant?.status ?? 'active'}
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <FeatureGate feature="online_payments">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Razorpay Integration</CardTitle>
                <CardDescription>
                  Connect your Razorpay account so students can pay fees online.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const form = new FormData(e.currentTarget)
                    try {
                      await saveRazorpay.mutateAsync({
                        keyId: form.get('keyId') as string,
                        keySecret: form.get('keySecret') as string,
                      })
                      toast.success('Razorpay credentials saved')
                    } catch (err: unknown) {
                      toast.error((err as { message?: string })?.message || 'Save failed')
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Key ID</label>
                    <Input name="keyId" defaultValue={integrations?.razorpay_key_id ?? ''} placeholder="rzp_live_xxxxx" required />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Key Secret</label>
                    <Input name="keySecret" type="password" placeholder="••••••••" required />
                  </div>
                  <Button type="submit" disabled={saveRazorpay.isPending}>
                    {saveRazorpay.isPending ? 'Saving…' : 'Save Razorpay Keys'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </FeatureGate>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="max-w-2xl">
            <NotificationPreferences />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
