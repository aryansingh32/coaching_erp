"use client"

import { NotificationPreferences } from "@/components/notifications/notification-preferences"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/lib/stores/auth-store"

export default function TeacherProfilePage() {
  const displayName = useAuthStore((s) => s.displayName)
  const erpId = useAuthStore((s) => s.erpId)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Teacher Profile</h2>
        <p className="text-muted-foreground">Manage your profile and settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium text-lg">
            {displayName ?? 'Instructor'}
          </p>
          <p className="text-muted-foreground">{erpId ? `ID: ${erpId}` : 'No ID provided'}</p>
        </CardContent>
      </Card>

      <NotificationPreferences />
    </div>
  )
}
