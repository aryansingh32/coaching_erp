"use client"

import { useState, useEffect } from "react"
import { Save, Building2, Palette, Link as LinkIcon, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// HSL to HEX and HEX to HSL helpers for the CSS variable manipulation
function hexToHSL(hex: string) {
  let r = 0, g = 0, b = 0
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1])
    g = parseInt("0x" + hex[2] + hex[2])
    b = parseInt("0x" + hex[3] + hex[3])
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2])
    g = parseInt("0x" + hex[3] + hex[4])
    b = parseInt("0x" + hex[5] + hex[6])
  }
  r /= 255
  g /= 255
  b /= 255
  const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin
  let h = 0, s = 0, l = 0

  if (delta === 0) h = 0
  else if (cmax === r) h = ((g - b) / delta) % 6
  else if (cmax === g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4

  h = Math.round(h * 60)
  if (h < 0) h += 360
  l = (cmax + cmin) / 2
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  s = +(s * 100).toFixed(1)
  l = +(l * 100).toFixed(1)
  return `${h} ${s}% ${l}%`
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    name: "Allen Career Institute",
    subdomain: "allen",
    primaryColor: "#0052cc", // Default blue
  })

  // Live preview effect for the color branding
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const hslValue = hexToHSL(settings.primaryColor)
      document.documentElement.style.setProperty('--inst-primary', hslValue)
    }
  }, [settings.primaryColor])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      toast({
        title: "Settings Saved",
        description: "Your white-label configuration has been updated successfully.",
      })
      setIsSaving(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-institute-text-primary">Platform Settings</h3>
        <p className="text-muted-foreground">Configure your white-label branding and institute details.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="general"><Building2 className="w-4 h-4 mr-2" /> General</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="w-4 h-4 mr-2" /> Branding</TabsTrigger>
          <TabsTrigger value="domains"><Globe className="w-4 h-4 mr-2" /> Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-institute-border shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle>General Profile</CardTitle>
              <CardDescription>Update your institute's core information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Institute Name</label>
                  <Input value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Support Email</label>
                  <Input type="email" defaultValue="support@allen.ac.in" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Contact Phone</label>
                  <Input type="tel" defaultValue="+91 9876543210" />
                </div>
                <Button type="submit" disabled={isSaving} className="bg-institute-primary text-primary-foreground hover:bg-institute-primary/90">
                  {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="border-institute-border shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle>White-Label Branding</CardTitle>
              <CardDescription>Customize the colors and logo of your portal. Changes reflect instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid gap-4 p-4 border rounded-md bg-muted/20">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Primary Brand Color</label>
                    <div className="flex items-center space-x-4">
                      <Input 
                        type="color" 
                        value={settings.primaryColor} 
                        onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                        className="w-16 h-12 p-1 cursor-pointer"
                      />
                      <Input 
                        type="text" 
                        value={settings.primaryColor}
                        onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                        className="w-32 font-mono uppercase"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This color is injected into `--inst-primary` and applied to all buttons, links, and accents.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Institute Logo</label>
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="text-center">
                      <Building2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium text-muted-foreground">Click to upload logo</span>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isSaving} className="bg-institute-primary text-primary-foreground hover:bg-institute-primary/90">
                  {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Branding</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card className="border-institute-border shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle>Custom Domains</CardTitle>
              <CardDescription>Manage your coachingOS subdomain or connect a custom domain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Platform Subdomain</label>
                <div className="flex items-center space-x-2">
                  <Input value={settings.subdomain} onChange={e => setSettings({...settings, subdomain: e.target.value})} className="max-w-[200px]" />
                  <span className="text-muted-foreground">.coachingos.app</span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-4">Connected Domains</h4>
                <div className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center space-x-3">
                    <LinkIcon className="h-4 w-4 text-institute-success" />
                    <span className="font-medium">app.allen.ac.in</span>
                  </div>
                  <Badge variant="outline" className="bg-institute-success/10 text-institute-success">Active</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Connect New Domain</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
