"use client"

import { useState } from "react"
import { useUpdateStudent } from "@/lib/api/hooks"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Edit2 } from "lucide-react"

export function UpdateStudentInfo({ student }: { student: any }) {
  const updateStudent = useUpdateStudent()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
  })

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateStudent.mutateAsync({ erpId: student.name, data: form })
      toast.success('Profile updated successfully')
      setOpen(false)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Could not update profile')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" zTier="medium">
        <DialogHeader>
          <DialogTitle>Update Profile Info</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground space-y-1">
            <p><strong>Note:</strong> Email and Mobile Number must be updated by contacting the administration office.</p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={updateStudent.isPending}>
              {updateStudent.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
