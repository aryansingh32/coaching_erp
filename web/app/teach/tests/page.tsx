"use client"

import { useMemo, useState } from "react"
import { useLmsCourses, useTests, useCreateQuiz } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { LoadingState } from "@/components/shared/loading-state"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Plus } from "lucide-react"
import { toast } from "sonner"
import type { MoodleQuiz } from "@/lib/api/types"

function getCourseIds(courses: unknown[]): number[] {
  return courses
    .map((c) => (c as { id?: number }).id)
    .filter((id): id is number => typeof id === 'number' && id > 0)
}

export default function TeachTestsPage() {
  const { data: courses, isLoading: cLoading } = useLmsCourses()
  const courseIds = useMemo(() => getCourseIds(courses ?? []), [courses])
  const { data: tests, isLoading: tLoading, refetch } = useTests(courseIds)
  const createQuiz = useCreateQuiz()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ courseId: '', name: '', intro: '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createQuiz.mutateAsync({
        courseId: parseInt(form.courseId, 10),
        name: form.name,
        intro: form.intro,
      })
      toast.success('Quiz created in Moodle')
      setOpen(false)
      refetch()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Create failed')
    }
  }

  if (cLoading || tLoading) return <LoadingState />

  const quizList = (tests ?? []) as MoodleQuiz[]

  return (
    <FeatureGate feature="online_tests">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">Quiz Builder</h3>
            <p className="text-muted-foreground">Author Moodle quizzes for your courses.</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Quiz
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {quizList.map((q) => (
            <Card key={q.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  {q.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">Course {q.courseid ?? q.course}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader><DialogTitle>Create Quiz</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Course</Label>
                  <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courseIds.map((id) => (
                        <SelectItem key={id} value={String(id)}>Course {id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quiz name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <Label>Introduction</Label>
                  <Input value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createQuiz.isPending || !form.courseId}>
                  {createQuiz.isPending ? 'Creating…' : 'Create Quiz'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  )
}
