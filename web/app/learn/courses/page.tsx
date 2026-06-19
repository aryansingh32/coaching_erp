"use client"

import { PlayCircle, Clock, CheckCircle2, ChevronRight, FileText, Video } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const MY_COURSES = [
  { 
    id: "CRS-01", 
    title: "JEE Mains Physics 2024", 
    instructor: "Dr. Sharma", 
    progress: 68, 
    nextTopic: "Thermodynamics: Second Law",
    thumbnail: "bg-blue-900/50"
  },
  { 
    id: "CRS-02", 
    title: "JEE Advanced Mathematics", 
    instructor: "Mr. Gupta", 
    progress: 42, 
    nextTopic: "Complex Numbers L3",
    thumbnail: "bg-orange-900/50"
  },
  { 
    id: "CRS-03", 
    title: "Organic Chemistry Crash Course", 
    instructor: "Dr. Singh", 
    progress: 100, 
    nextTopic: "Course Completed",
    thumbnail: "bg-green-900/50"
  }
]

export default function CoursesPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">My Courses</h2>
        <p className="text-muted-foreground">Access your enrolled batches, video lectures, and study materials.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MY_COURSES.map((course) => (
          <Card key={course.id} className="border-border shadow-md bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
            {/* Thumbnail Header */}
            <div className={`h-32 ${course.thumbnail} relative flex items-center justify-center border-b border-border`}>
              <PlayCircle className="w-12 h-12 text-white/50" />
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-xl line-clamp-1">{course.title}</CardTitle>
              <CardDescription>Instructor: {course.instructor}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 flex-1">
              <div>
                <div className="flex justify-between mb-1 text-xs">
                  <span className="text-muted-foreground">Course Progress</span>
                  <span className="font-medium">{course.progress}%</span>
                </div>
                <div className="w-full bg-accent rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${course.progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="rounded-md bg-accent/30 p-3">
                <p className="text-xs text-muted-foreground mb-1">Up Next / Last Left Off:</p>
                <p className="text-sm font-medium flex items-center">
                  {course.progress === 100 ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> {course.nextTopic}</>
                  ) : (
                    <><Clock className="w-4 h-4 mr-2 text-primary" /> {course.nextTopic}</>
                  )}
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0 flex gap-2">
              <Button className="w-full" variant={course.progress === 100 ? "outline" : "default"}>
                {course.progress === 100 ? "Review Material" : "Continue Learning"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="pt-8 border-t border-border">
        <h3 className="text-xl font-bold mb-4">Study Resources</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border shadow-sm bg-card/50 cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-medium">DPP (Daily Practice Problems)</h4>
                  <p className="text-sm text-muted-foreground">Download worksheets for all subjects</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card className="border-border shadow-sm bg-card/50 cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Video className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium">Recorded Lectures Archive</h4>
                  <p className="text-sm text-muted-foreground">Missed a class? Watch recordings here.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
