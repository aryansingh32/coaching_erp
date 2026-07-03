"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useAddLmsCourseContent } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function CourseUploadPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = use(params)
  const courseIdNum = parseInt(courseId, 10)
  const upload = useAddLmsCourseContent(courseIdNum)
  const [name, setName] = useState('')
  const [externalurl, setExternalurl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upload.mutateAsync({ name, externalurl: externalurl || undefined })
      toast.success('Content added to course')
      setName('')
      setExternalurl('')
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Upload failed')
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !name) {
      toast.error('Enter a title first')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        await upload.mutateAsync({
          name,
          filename: file.name,
          filecontentBase64: base64,
        })
        toast.success('File uploaded via Moodle')
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message || 'File upload failed')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <FeatureGate feature="moodle_lms">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/teach/courses"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h3 className="text-2xl font-bold">Upload Content</h3>
            <p className="text-sm text-muted-foreground">Course {courseId}</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Add URL or File</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div>
                <Label>Title</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <Label>External URL (optional)</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={externalurl}
                  onChange={(e) => setExternalurl(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={upload.isPending}>
                {upload.isPending ? 'Saving…' : 'Add URL Module'}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t">
              <Label>Or upload a file</Label>
              <input type="file" className="mt-2 block text-sm" onChange={handleFile} />
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  )
}
