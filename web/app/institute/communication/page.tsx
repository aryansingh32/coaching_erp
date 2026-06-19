"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"

export default function CommunicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Communication</h3>
        <p className="text-muted-foreground">
          Notifications powered by Novu via @novu/notification-center once configured.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
          <CardDescription>Install @novu/notification-center and set NEXT_PUBLIC_NOVU_APP_ID</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Novu integration pending"
            description="Add the Novu React bell component to the institute topbar per UX_plan_V2."
          />
        </CardContent>
      </Card>
    </div>
  )
}
