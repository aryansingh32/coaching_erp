"use client"

import { useState } from "react"
import { useApplyLeave } from "@/lib/api/hooks"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { CalendarOff } from "lucide-react"
import { Batch } from "@/lib/api/types"

export function LeaveRequestForm({ studentId, batches }: { studentId: string, batches: Batch[] }) {
  const applyLeave = useApplyLeave()
  const [open, setOpen] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    from_date: '',
    to_date: '',
    reason: '',
    student_group: '',
  })

  const handleLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await applyLeave.mutateAsync({ studentId, data: leaveForm })
      toast.success('Leave request submitted successfully')
      setLeaveForm({ from_date: '', to_date: '', reason: '', student_group: '' })
      setOpen(false)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Could not submit leave')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CalendarOff className="w-4 h-4" />
          Apply for Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" zTier="medium">
        <DialogHeader>
          <DialogTitle>Leave Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleLeave} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Batch / Program</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={leaveForm.student_group}
              onChange={(e) => setLeaveForm({ ...leaveForm, student_group: e.target.value })}
              required
            >
              <option value="">Select batch</option>
              {batches.map((b) => {
                const id = b.name ?? b.student_group_name ?? ''
                return (
                  <option key={id} value={id}>{b.student_group_name ?? b.name}</option>
                )
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={leaveForm.from_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, from_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={leaveForm.to_date}
                onChange={(e) => setLeaveForm({ ...leaveForm, to_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason for Leave</Label>
            <Textarea
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              required
              placeholder="Please provide a brief reason..."
              className="min-h-[100px]"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={applyLeave.isPending}>
              {applyLeave.isPending ? 'Submitting…' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
