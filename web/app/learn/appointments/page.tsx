"use client"

import { AppointmentScheduler } from "@/components/learn/appointment-scheduler"

export default function LearnAppointmentsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
        <p className="text-muted-foreground mt-2">
          Schedule a meeting with an instructor or administrator.
        </p>
      </div>

      <AppointmentScheduler />
    </div>
  )
}
