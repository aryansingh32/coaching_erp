"use client"

import { useState } from "react"
import { useLmsCourses, useCreateLmsCourse } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { BookOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

interface MoodleCourse {
  id?: number
  fullname?: string
  summary?: string
  categoryName?: string
}

export default function InstituteCoursesPage() {
  const { data: courses, isLoading, isError, refetch } = useLmsCourses()
  const createCourse = useCreateLmsCourse()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ fullname: '', shortname: '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCourse.mutateAsync(form)
      toast.success('Course created')
      setOpen(false)
      refetch()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed')
    }
  }

  if (isLoading) return <LoadingState message="Loading LMS courses..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const courseList = (courses as MoodleCourse[] | undefined) ?? []

  return (
    <FeatureGate feature="moodle_lms">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">LMS Courses</h3>
            <p className="text-muted-foreground">Headless Moodle course catalog via gateway.</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>

        {courseList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No Moodle courses yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courseList.map((course, idx) => (
              <Card key={course.id ?? idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{course.fullname}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.summary ? course.summary.replace(/<[^>]+>/g, '') : 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" size="sm" className="w-full" asChild>
                    <Link href={`/institute/courses/${course.id}`}>Manage</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader><DialogTitle>New Moodle Course</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Full name</Label>
                  <Input value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} required />
                </div>
                <div>
                  <Label>Short name</Label>
                  <Input value={form.shortname} onChange={(e) => setForm({ ...form, shortname: e.target.value })} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createCourse.isPending}>Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  )
}
