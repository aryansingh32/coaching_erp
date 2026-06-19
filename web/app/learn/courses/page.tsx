"use client"

import Link from "next/link"
import { useBatches } from "@/lib/api/hooks"
import { PlayCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import type { Batch } from "@/lib/api/types"

function getBatchId(batch: Batch) {
  return batch.id ?? batch.name ?? batch.student_group_name ?? ''
}

export default function CoursesPage() {
  const { data: batches, isLoading, isError, refetch } = useBatches()

  if (isLoading) return <LoadingState message="Loading courses..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">My Courses</h2>
        <p className="text-muted-foreground">Batches enrolled via ERPNext Education.</p>
      </div>

      {!batches?.length ? (
        <EmptyState title="No courses" description="You are not enrolled in any batches yet." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((course) => {
            const id = getBatchId(course)
            return (
              <Card key={id} className="border-border bg-card/50 flex flex-col">
                <div className="h-32 bg-primary/10 flex items-center justify-center border-b">
                  <PlayCircle className="w-12 h-12 text-primary/50" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl line-clamp-1">
                    {course.student_group_name ?? course.name ?? id}
                  </CardTitle>
                  <CardDescription>{course.program ?? 'Program'}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <Button className="w-full" asChild>
                    <Link href={`/learn/courses/${encodeURIComponent(id)}`}>
                      View Course
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
