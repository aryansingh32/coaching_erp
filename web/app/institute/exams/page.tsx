"use client"

import { useMemo, useState } from "react"
import { useLmsCourses, useTests, useCreateQuiz } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import type { MoodleQuiz } from "@/lib/api/types"

function getCourseIds(courses: unknown[]): number[] {
  return courses
    .map((c) => (c as { id?: number }).id)
    .filter((id): id is number => typeof id === 'number' && id > 0)
}

export default function ExamsPage() {
  const { data: courses } = useLmsCourses()
  const courseIds = useMemo(() => getCourseIds(courses ?? []), [courses])
  const [filterIds, setFilterIds] = useState('')
  const ids = filterIds
    ? filterIds.split(',').map((id) => parseInt(id.trim(), 10)).filter(Boolean)
    : courseIds
  const { data: tests, isLoading, isError, refetch } = useTests(ids)
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
      toast.success('Quiz created')
      setOpen(false)
      refetch()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed')
    }
  }

  return (
    <FeatureGate feature="online_tests">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold">Exams & Moodle Tests</h3>
            <p className="text-muted-foreground">Manage quizzes via gateway — no direct Moodle access.</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Quiz
          </Button>
        </div>
        <Input
          placeholder="Filter by course IDs (comma-separated, optional)"
          value={filterIds}
          onChange={(e) => setFilterIds(e.target.value)}
          className="max-w-md"
        />
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <EmptyState title="Failed to load tests" />
        ) : !tests?.length ? (
          <EmptyState title="No quizzes found" />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Time Limit</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tests as MoodleQuiz[]).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline">{t.courseid ?? t.course}</Badge></TableCell>
                      <TableCell>{t.timelimit ? `${Math.round(t.timelimit / 60)} min` : '—'}</TableCell>
                      <TableCell>{t.grade ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

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
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createQuiz.isPending || !form.courseId}>Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  )
}
