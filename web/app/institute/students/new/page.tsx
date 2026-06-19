"use client"

import { useRouter } from "next/navigation"
import { useCreateStudent } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function NewStudentPage() {
  const router = useRouter()
  const createStudent = useCreateStudent()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      await createStudent.mutateAsync({
        first_name: form.get('first_name') as string,
        last_name: (form.get('last_name') as string) || undefined,
        student_email_id: (form.get('email') as string) || undefined,
        student_mobile_number: (form.get('phone') as string) || undefined,
      })
      toast.success('Student created in ERPNext')
      router.push('/institute/students')
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message || 'Failed to create student')
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Add Student</h3>
        <p className="text-muted-foreground">Creates a new Student record via POST /students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">First Name *</label>
              <Input name="first_name" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Name</label>
              <Input name="last_name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input name="phone" type="tel" />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStudent.isPending}>
                {createStudent.isPending ? 'Creating...' : 'Create Student'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
