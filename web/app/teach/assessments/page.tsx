"use client"

import { useState } from "react"
import { useBatches, useBatchStudents, useCreateAssessmentResult } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Edit3 } from "lucide-react"
import { toast } from "sonner"
import type { Batch } from "@/lib/api/types"
import { FeatureGate } from "@/components/shared/feature-gate"

export default function TeacherAssessmentsPage() {
  const { data: batches, isLoading, isError, refetch } = useBatches()
  const [selectedBatch, setSelectedBatch] = useState('')
  const { data: batchStudents, isLoading: sLoading } = useBatchStudents(selectedBatch)
  const createResult = useCreateAssessmentResult()
  const [editingStudent, setEditingStudent] = useState<{ student: string; student_name?: string } | null>(null)
  const [form, setForm] = useState({
    assessment_plan: '',
    program: '',
    course: '',
    total_score: '',
    maximum_score: '100',
  })

  const batch = (batches as Batch[] | undefined)?.find(
    (b) => (b.name ?? b.student_group_name) === selectedBatch,
  )

  const handleSave = async () => {
    if (!editingStudent) return
    try {
      await createResult.mutateAsync({
        student: editingStudent.student,
        assessment_plan: form.assessment_plan,
        program: form.program || batch?.program || 'General',
        course: form.course,
        total_score: parseFloat(form.total_score),
        maximum_score: parseFloat(form.maximum_score),
      })
      toast.success('Grade saved to ERPNext')
      setEditingStudent(null)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Save failed')
    }
  }

  if (isLoading) return <LoadingState message="Loading your batches..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const batchList = (batches as Batch[]) ?? []
  const students = batchStudents ?? []

  return (
    <FeatureGate feature="grades">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Gradebook</h3>
          <p className="text-muted-foreground">Enter assessment results via POST /education/assessment-results.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select a Batch" />
              </SelectTrigger>
              <SelectContent>
                {batchList.map((b) => {
                  const id = b.name ?? b.student_group_name ?? ''
                  return (
                    <SelectItem key={id} value={id}>
                      {b.student_group_name ?? b.name}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedBatch ? (
              <div className="p-12 text-center text-muted-foreground">Select a batch to enter grades.</div>
            ) : sLoading ? (
              <LoadingState />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.student}>
                      <TableCell className="font-mono text-xs">{s.student}</TableCell>
                      <TableCell>{s.student_name ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingStudent(s)
                            setForm({
                              assessment_plan: `Assessment-${selectedBatch}`,
                              program: batch?.program ?? 'General',
                              course: batch?.program ?? 'General',
                              total_score: '',
                              maximum_score: '100',
                            })
                          }}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Enter Grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grade — {editingStudent?.student_name ?? editingStudent?.student}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Assessment Plan</Label>
                <Input value={form.assessment_plan} onChange={(e) => setForm({ ...form, assessment_plan: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Score</Label>
                  <Input type="number" value={form.total_score} onChange={(e) => setForm({ ...form, total_score: e.target.value })} />
                </div>
                <div>
                  <Label>Maximum</Label>
                  <Input type="number" value={form.maximum_score} onChange={(e) => setForm({ ...form, maximum_score: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={createResult.isPending || !form.total_score}>
                {createResult.isPending ? 'Saving…' : 'Save Grade'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  )
}
