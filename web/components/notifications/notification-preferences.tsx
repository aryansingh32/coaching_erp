"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useNotificationPreferences, useUpdateNotificationPreferences } from "@/lib/api/hooks"
import { Bell, Mail, Smartphone, Clock, Save, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import type { NotificationPreferences as PrefsType } from "@/lib/api/types"
import { Skeleton } from "@/components/ui/skeleton"

export function NotificationPreferences() {
  const { data: prefs, isLoading, isError } = useNotificationPreferences()
  const updatePrefs = useUpdateNotificationPreferences()

  const [localPrefs, setLocalPrefs] = useState<PrefsType>({
    email: true,
    sms: false,
    push: true,
    quietHours: { enabled: false, start: "22:00", end: "08:00" },
  })

  // Sync local state when fetched
  useEffect(() => {
    if (prefs) {
      setLocalPrefs({
        email: prefs.email ?? true,
        sms: prefs.sms ?? false,
        push: prefs.push ?? true,
        quietHours: {
          enabled: prefs.quietHours?.enabled ?? false,
          start: prefs.quietHours?.start ?? "22:00",
          end: prefs.quietHours?.end ?? "08:00",
        },
      })
    }
  }, [prefs])

  const handleSave = () => {
    updatePrefs.mutate(localPrefs, {
      onSuccess: () => toast.success("Notification preferences updated"),
      onError: () => toast.error("Failed to update preferences"),
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-6 text-center text-red-600">
          <p>Failed to load notification settings. Please try again later.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notification Settings
            </CardTitle>
            <CardDescription>Manage how and when you receive updates.</CardDescription>
          </div>
          <Button onClick={handleSave} disabled={updatePrefs.isPending} size="sm">
            {updatePrefs.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Channels */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Channels</h4>
          
          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="pref-email" className="font-medium cursor-pointer">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive daily summaries and critical alerts via email.</p>
              </div>
            </div>
            <Switch 
              id="pref-email" 
              checked={localPrefs.email}
              onCheckedChange={(c) => setLocalPrefs(prev => ({ ...prev, email: c }))}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-700 rounded-md">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="pref-sms" className="font-medium cursor-pointer">SMS Notifications</Label>
                <p className="text-xs text-muted-foreground">Get instant text messages for urgent updates.</p>
              </div>
            </div>
            <Switch 
              id="pref-sms" 
              checked={localPrefs.sms}
              onCheckedChange={(c) => setLocalPrefs(prev => ({ ...prev, sms: c }))}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-md">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <Label htmlFor="pref-push" className="font-medium cursor-pointer">In-App & Push</Label>
                <p className="text-xs text-muted-foreground">Receive notifications in the browser and mobile app.</p>
              </div>
            </div>
            <Switch 
              id="pref-push" 
              checked={localPrefs.push}
              onCheckedChange={(c) => setLocalPrefs(prev => ({ ...prev, push: c }))}
            />
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Quiet Hours</h4>
            </div>
            <Switch 
              checked={localPrefs.quietHours.enabled}
              onCheckedChange={(c) => setLocalPrefs(prev => ({ 
                ...prev, 
                quietHours: { ...prev.quietHours, enabled: c } 
              }))}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Mute non-urgent notifications during these hours.
          </p>

          {localPrefs.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-slate-50 rounded-lg border">
              <div className="space-y-1.5">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input 
                  id="quiet-start" 
                  type="time" 
                  value={localPrefs.quietHours.start}
                  onChange={(e) => setLocalPrefs(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, start: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input 
                  id="quiet-end" 
                  type="time" 
                  value={localPrefs.quietHours.end}
                  onChange={(e) => setLocalPrefs(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, end: e.target.value }
                  }))}
                />
              </div>
            </div>
          )}
        </div>
        
      </CardContent>
    </Card>
  )
}
