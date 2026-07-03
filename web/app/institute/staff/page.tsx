"use client"

import { useState } from "react"
import {
  useInstructors,
  useCreateInstructor,
  useDeactivateInstructor,
} from "@/lib/api/hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Plus, UserMinus } from "lucide-react"
import { toast } from "sonner"
import type { Instructor } from "@/lib/api/types"

export default function StaffPage() {
  const { data: instructors, isLoading, isError, refetch } = useInstructors()
  const createInstructor = useCreateInstructor()
  const deactivate = useDeactivateInstructor()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ instructor_name: '', cell_number: '', email_address: '' })

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createInstructor.mutateAsync(form)
      toast.success('Instructor created in ERPNext')
      setOpen(false)
      setForm({ instructor_name: '', cell_number: '', email_address: '' })
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed')
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await deactivate.mutateAsync(id)
      toast.success('Instructor deactivated')
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed')
    }
  }

  if (isLoading) return <LoadingState message="Loading staff..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const list = (instructors ?? []) as Instructor[]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Staff & Instructors</h3>
          <p className="text-muted-foreground">Institute directory via GET /education/instructors.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Instructor
        </Button>
      </div>

      {!list.length ? (
        <EmptyState title="No instructors" />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((inst) => (
                  <TableRow key={inst.name}>
                    <TableCell className="font-mono text-xs">{inst.name}</TableCell>
                    <TableCell className="font-medium">{inst.instructor_name}</TableCell>
                    <TableCell>{inst.cell_number ?? '—'}</TableCell>
                    <TableCell>{inst.email_address ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={inst.status === 'Left' ? 'secondary' : 'default'}>
                        {inst.status ?? 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inst.status !== 'Left' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeactivate(inst.name)}>
                          <UserMinus className="w-4 h-4 mr-1" /> Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleInvite}>
            <DialogHeader><DialogTitle>Add Instructor</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Name</Label>
                <Input value={form.instructor_name} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })} required />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.cell_number} onChange={(e) => setForm({ ...form, cell_number: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email_address} onChange={(e) => setForm({ ...form, email_address: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createInstructor.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
