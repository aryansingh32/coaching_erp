"use client"

import { FeatureGate } from "@/components/shared/feature-gate"
import { NovuNotificationBell } from "@/components/notifications/novu-bell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function CommunicationPage() {
  return (
    <FeatureGate feature="communication">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Communication</h3>
            <p className="text-muted-foreground">
              Announcements and notifications via Novu through the gateway.
            </p>
          </div>
          <FeatureGate feature="notifications" hide>
            <NovuNotificationBell />
          </FeatureGate>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Notification Center</CardTitle>
            <CardDescription>
              Novu delivers push/SMS/email when gateway events fire (fees, attendance, class reminders).
              Template management is in Super Admin → Notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            All notification traffic is server-side — the frontend never calls Novu APIs directly.
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  )
}
