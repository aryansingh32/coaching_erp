"use client"

import { useRouter } from "next/navigation"
import { useCreateStudent } from "@/lib/api/hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormSection, FormFieldGroup } from "@/components/ui/form-section"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Student</h1>
            <p className="text-muted-foreground text-sm">Create a new student record</p>
          </div>
        </div>
      </div>

      <form id="student-form" onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardContent className="p-0 sm:p-6">
            <FormSection 
              title="Personal Details" 
              description="Basic information about the student."
            >
              <FormFieldGroup>
                <div>
                  <Label htmlFor="first_name">First Name <span className="text-destructive">*</span></Label>
                  <Input id="first_name" name="first_name" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" name="last_name" className="mt-1" />
                </div>
              </FormFieldGroup>

              <FormFieldGroup>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select name="blood_group">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FormFieldGroup>
            </FormSection>

            <FormSection 
              title="Contact Information" 
              description="How the institute will contact the student."
            >
              <FormFieldGroup>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" placeholder="student@example.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input id="phone" name="phone" type="tel" placeholder="+1234567890" className="mt-1" />
                </div>
              </FormFieldGroup>
            </FormSection>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Discard
          </Button>
          <Button type="submit" disabled={createStudent.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {createStudent.isPending ? 'Saving...' : 'Save Student'}
          </Button>
        </div>
      </form>
    </div>
  )
}
