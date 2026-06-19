"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Security & Compliance</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader><CardTitle>Authentication</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>OTP via phone with role-based JWT (15m access, 7d refresh).</p>
            <p>Super admin phones configured via SUPER_ADMIN_PHONES env.</p>
            <p>All tenant write APIs require super_admin or admin role.</p>
          </CardContent>
        </Card>
        <Card className="bg-platform-surface border-platform-border">
          <CardHeader><CardTitle>Data Isolation</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>Parent role restricted to linked guardian students only.</p>
            <p>ERPNext/Moodle never exposed directly — all via gateway BFF.</p>
            <p>Blocked doctypes: System Settings, User, Role.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
