"use client"

import { FeatureGate } from "@/components/shared/feature-gate"
import { NovuNotificationBell } from "@/components/notifications/novu-bell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function TeachCommunicationPage() {
  return (
    <FeatureGate feature="communication">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">Batch Communication</h3>
            <p className="text-muted-foreground">
              Notifications are delivered via Novu — all traffic through the gateway, never direct to Novu API.
            </p>
          </div>
          <NovuNotificationBell />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Announcement Center</CardTitle>
            <CardDescription>
              Institute admins configure Novu workflows in Super Admin → Notifications.
              Teachers receive batch alerts through the Novu bell above.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Fee reminders, absence alerts, and class announcements are triggered server-side
            when attendance/fees events fire in the gateway (ERPNext → Novu worker).
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  )
}
