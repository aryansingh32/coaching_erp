"use client"

import { BookOpen, Calendar as CalendarIcon, Clock, Award, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProgressRing } from "@/components/shared/progress-ring"

export default function StudentDashboard() {
  const nextClass = {
    subject: "Physics - Thermodynamics",
    time: "08:00 AM Today",
    instructor: "Dr. Sharma",
    room: "Room 402 / Online"
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back, Alice!</h2>
          <p className="text-muted-foreground max-w-md">
            You're in the top 10% of your batch this week. Keep up the great work and crush your upcoming tests.
          </p>
          <div className="mt-4 flex gap-3">
            <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
              <Award className="w-3 h-3 mr-1" /> Scholar Rank #4
            </Badge>
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Next Class Widget */}
        <Card className="md:col-span-2 border-border shadow-md bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CalendarIcon className="w-5 h-5 mr-2 text-primary" /> 
              Up Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-accent/50 border border-border">
              <div className="space-y-1 mb-4 sm:mb-0">
                <h4 className="font-bold text-lg">{nextClass.subject}</h4>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> {nextClass.time}
                </p>
                <p className="text-sm text-muted-foreground">Instructor: {nextClass.instructor}</p>
              </div>
              <Button className="w-full sm:w-auto shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
                Join Class
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gamified Attendance Ring */}
        <Card className="border-border shadow-md bg-card/50 backdrop-blur-sm flex flex-col justify-center items-center p-6">
          <h3 className="font-semibold mb-4 text-center">Attendance Goal</h3>
          <ProgressRing progress={85} size={140} strokeWidth={12} className="text-primary" />
          <p className="text-sm text-muted-foreground text-center mt-4">
            You need 90% to unlock the <br/><span className="text-primary font-medium">Dedication Badge</span>
          </p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Assignments */}
        <Card className="border-border shadow-md bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Assignments</CardTitle>
              <CardDescription>Due this week</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">View All</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer border border-transparent hover:border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-orange-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Physics Worksheet 4</p>
                  <p className="text-xs text-muted-foreground">Due tomorrow, 11:59 PM</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer border border-transparent hover:border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Math Problem Set</p>
                  <p className="text-xs text-muted-foreground">Due Friday</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Test Performance */}
        <Card className="border-border shadow-md bg-card/50">
          <CardHeader>
            <CardTitle>Recent Test Performance</CardTitle>
            <CardDescription>Mock Test 1 (JEE Mains)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Physics</span>
                  <span className="font-medium">85/100</span>
                </div>
                <div className="w-full bg-accent rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Chemistry</span>
                  <span className="font-medium">92/100</span>
                </div>
                <div className="w-full bg-accent rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Mathematics</span>
                  <span className="font-medium">65/100</span>
                </div>
                <div className="w-full bg-accent rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
      {children}
    </span>
  )
}
