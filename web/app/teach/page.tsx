"use client"

import { Clock, Users, BookOpen, Video, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const TODAY_SCHEDULE = [
  { id: 1, time: "08:00 AM - 10:00 AM", batch: "BCH-A-24", subject: "Physics", topic: "Thermodynamics: Laws 1 & 2", room: "Room 402", type: "Offline" },
  { id: 2, time: "11:30 AM - 01:30 PM", batch: "BCH-B-24", subject: "Physics", topic: "Kinematics Revision", room: "Online Zoom", type: "Online" },
  { id: 3, time: "03:00 PM - 05:00 PM", batch: "BCH-C-24", subject: "Science Foundation", topic: "Light & Optics", room: "Room 105", type: "Offline" },
]

export default function TeachDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Good morning, Dr. Sharma.</h2>
        <p className="text-slate-500">You have 3 classes scheduled for today. Your first class starts in 45 minutes.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Hours Today</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">6.0</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Students</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">135</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200 md:col-span-2 bg-blue-50 border-blue-100">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Pending Action</h4>
              <p className="text-sm text-blue-700">You haven't marked attendance for yesterday's 4:00 PM class.</p>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Mark Now</Button>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-bold text-slate-900 pt-4">Today's Itinerary</h3>
      
      <div className="space-y-4">
        {TODAY_SCHEDULE.map((cls, index) => (
          <Card key={cls.id} className={`shadow-sm overflow-hidden ${index === 0 ? 'border-l-4 border-l-blue-600' : 'border-slate-200'}`}>
            <CardContent className="p-0 sm:p-6 sm:pb-6">
              <div className="flex flex-col sm:flex-row justify-between p-4 sm:p-0">
                <div className="flex items-start space-x-4 mb-4 sm:mb-0">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase">{cls.time.split(" ")[1]}</span>
                    <span className="text-lg font-bold text-slate-900">{cls.time.split(":")[0]}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-lg text-slate-900">{cls.batch}</h4>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${cls.type === 'Online' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {cls.type}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">{cls.subject}: {cls.topic}</p>
                    <div className="flex items-center text-sm text-slate-500 mt-2 space-x-4">
                      <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {cls.time}</span>
                      <span className="flex items-center">
                        {cls.type === 'Online' ? <Video className="w-3.5 h-3.5 mr-1" /> : <BookOpen className="w-3.5 h-3.5 mr-1" />}
                        {cls.room}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex sm:flex-col justify-end space-x-2 sm:space-x-0 sm:space-y-2">
                  <Button variant={index === 0 ? "default" : "outline"} className={index === 0 ? "bg-blue-600 hover:bg-blue-700" : ""}>
                    Start Class
                  </Button>
                  <Button variant="ghost" className="text-slate-600">
                    Syllabus <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
