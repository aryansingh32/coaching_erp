"use client"

import { useState } from "react"
import Link from "next/link"
import { useLmsCourses, useCreateLmsCourse } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { BookOpen, Plus, Upload } from "lucide-react"
import { toast } from "sonner"

interface MoodleCourse {
  id?: number
  fullname?: string
  shortname?: string
}

export default function TeachCoursesPage() {
  const { data: courses, isLoading, isError, refetch } = useLmsCourses()
  const createCourse = useCreateLmsCourse()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ fullname: '', shortname: '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCourse.mutateAsync(form)
      toast.success('Course created in Moodle')
      setOpen(false)
      setForm({ fullname: '', shortname: '' })
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Create failed')
    }
  }

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const list = (courses as MoodleCourse[] | undefined) ?? []

  return (
    <FeatureGate feature="moodle_lms">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">My Courses</h3>
            <p className="text-muted-foreground">Create and manage Moodle courses via the gateway.</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Course
          </Button>
        </div>

        {!list.length ? (
          <EmptyState title="No courses" description="Create your first Moodle course." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {c.fullname}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/teach/courses/${c.id}/upload`}>
                      <Upload className="w-4 h-4 mr-1" /> Add Content
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Moodle Course</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Full name</Label>
                  <Input
                    value={form.fullname}
                    onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Short name</Label>
                  <Input
                    value={form.shortname}
                    onChange={(e) => setForm({ ...form, shortname: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createCourse.isPending}>
                  {createCourse.isPending ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  )
}
