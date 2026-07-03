"use client"

import { use } from "react"
import Link from "next/link"
import { getLmsCourseContent } from "@/lib/api/services"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-keys"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/loading-state"
import { ArrowLeft, Upload } from "lucide-react"

export default function InstituteCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const courseId = parseInt(id, 10)
  const { data: content, isLoading } = useQuery({
    queryKey: queryKeys.lms.content(courseId),
    queryFn: () => getLmsCourseContent(courseId),
    enabled: courseId > 0,
  })

  return (
    <FeatureGate feature="moodle_lms">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/institute/courses"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h3 className="text-2xl font-bold">Course {id}</h3>
            <p className="text-sm text-muted-foreground">Moodle content via GET /lms/courses/:id/content</p>
          </div>
        </div>
        {isLoading ? (
          <LoadingState />
        ) : (
          <Card>
            <CardHeader><CardTitle>Modules</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(content, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  )
}
