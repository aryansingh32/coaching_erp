"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar as CalendarIcon } from "lucide-react"

export function AppointmentScheduler() {
  return (
    <Card className="max-w-3xl mx-auto shadow-sm border-inst-border">
      <CardHeader className="border-b bg-muted/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Book an Appointment</CardTitle>
            <CardDescription className="mt-1">
              Schedule a meeting with our staff
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold">Coming Soon</h3>
        <p className="text-muted-foreground mt-2 max-w-md">
          The appointment booking feature is currently under development. 
          Please contact the institute directly to schedule an appointment.
        </p>
      </CardContent>
    </Card>
  )
}
