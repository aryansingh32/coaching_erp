"use client"

import { useSchoolDiary } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, User, Clock } from "lucide-react"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"

export function SchoolDiaryFeed({ batchName }: { batchName?: string }) {
  const { data: diaryEntries, isLoading, isError } = useSchoolDiary(batchName)

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-inst-primary" />
            School Diary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState message="Loading recent announcements..." />
        </CardContent>
      </Card>
    )
  }

  if (isError || !diaryEntries || diaryEntries.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-inst-primary" />
            School Diary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="No recent diary entries" description="You're all caught up!" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col shadow-sm border-inst-border">
      <CardHeader className="pb-3 border-b bg-muted/10">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-inst-primary" />
          School Diary
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="divide-y">
          {diaryEntries.map((entry, idx) => (
            <div key={idx} className="p-4 hover:bg-muted/10 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-foreground">{entry.title}</h4>
              </div>
              
              <div className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">
                {entry.content}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {entry.date}
                </span>
                {entry.instructor_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {entry.instructor_name}
                  </span>
                )}
                {entry.student_group && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {entry.student_group}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
