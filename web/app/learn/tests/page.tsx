"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useLmsCourses, useTests } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { ClipboardList, Clock } from "lucide-react"
import type { MoodleQuiz } from "@/lib/api/types"

function getCourseIds(courses: unknown[]): number[] {
  return courses
    .map((c) => {
      const course = c as { id?: number }
      return course.id
    })
    .filter((id): id is number => typeof id === 'number' && id > 0)
}

export default function LearnTestsPage() {
  const { data: courses, isLoading: coursesLoading, isError: coursesError, refetch: refetchCourses } = useLmsCourses()
  const courseIds = useMemo(() => getCourseIds(courses ?? []), [courses])
  const { data: tests, isLoading: testsLoading, isError: testsError, refetch: refetchTests } = useTests(courseIds)

  const isLoading = coursesLoading || (courseIds.length > 0 && testsLoading)
  const isError = coursesError || testsError

  if (isLoading) return <LoadingState message="Loading quizzes..." />
  if (isError) return <ErrorState onRetry={() => { refetchCourses(); refetchTests() }} />

  const quizList = (tests ?? []) as MoodleQuiz[]

  return (
    <FeatureGate feature="online_tests">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Online Tests</h2>
          <p className="text-muted-foreground">Moodle quizzes for your enrolled courses.</p>
        </div>

        {!courseIds.length ? (
          <EmptyState title="No courses enrolled" description="You need Moodle course access before quizzes appear." />
        ) : !quizList.length ? (
          <EmptyState title="No quizzes available" description="Your instructors have not published any tests yet." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {quizList.map((quiz) => (
              <Card key={quiz.id} className="border-border bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-primary shrink-0" />
                      {quiz.name}
                    </CardTitle>
                    <Badge variant="outline">Course {quiz.courseid ?? quiz.course}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quiz.timelimit ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.round(quiz.timelimit / 60)} minute time limit
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No time limit</p>
                  )}
                  <Button className="w-full" asChild>
                    <Link href={`/learn/tests/${quiz.id}/attempt`}>Start Test</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </FeatureGate>
  )
}
