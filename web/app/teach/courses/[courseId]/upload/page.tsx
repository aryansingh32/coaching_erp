"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useCreateMoodleActivity, useAddLmsCourseContent } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, FileText, Link as LinkIcon, MessageSquare, ClipboardList, PenTool, LayoutTemplate } from "lucide-react"
import { toast } from "sonner"

const ACTIVITY_TYPES = [
  { id: 'assign', name: 'Assignment', icon: ClipboardList, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'forum', name: 'Forum', icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'quiz', name: 'Quiz', icon: PenTool, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'resource', name: 'File Resource', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'url', name: 'URL Link', icon: LinkIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'scorm', name: 'SCORM Package', icon: LayoutTemplate, color: 'text-yellow-600', bg: 'bg-yellow-50' },
]

export default function CourseUploadPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = use(params)
  const courseIdNum = parseInt(courseId, 10)
  
  const createActivity = useCreateMoodleActivity()
  const uploadContent = useAddLmsCourseContent(courseIdNum)
  
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [intro, setIntro] = useState('')
  const [externalUrl, setExternalUrl] = useState('')

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) return
    
    try {
      if (selectedType === 'url' || selectedType === 'resource') {
        // Fallback to basic LMS upload for standard files/urls for now
        await uploadContent.mutateAsync({ name, externalurl: externalUrl || undefined })
      } else {
        // Advanced Moodle Activities
        await createActivity.mutateAsync({
          courseId: courseIdNum,
          data: {
            type: selectedType,
            name,
            intro,
          }
        })
      }
      toast.success(`${ACTIVITY_TYPES.find(t => t.id === selectedType)?.name} created successfully`)
      setName('')
      setIntro('')
      setExternalUrl('')
      setSelectedType(null)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to create activity')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !name) {
      toast.error('Enter a title first before selecting file')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        await uploadContent.mutateAsync({
          name,
          filename: file.name,
          filecontentBase64: base64,
        })
        toast.success('File uploaded successfully')
        setSelectedType(null)
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message || 'File upload failed')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <FeatureGate feature="moodle_lms">
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 border-b pb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/teach/courses"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Add Activity or Resource</h3>
            <p className="text-sm text-muted-foreground">Course {courseId} • Select a module type to author</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {ACTIVITY_TYPES.map(act => (
            <Dialog key={act.id} open={selectedType === act.id} onOpenChange={(open) => !open && setSelectedType(null)}>
              <DialogTrigger asChild>
                <Card 
                  className="cursor-pointer hover:border-inst-primary/50 hover:shadow-md transition-all group"
                  onClick={() => setSelectedType(act.id)}
                >
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-4">
                    <div className={`p-4 rounded-full ${act.bg} group-hover:scale-110 transition-transform`}>
                      <act.icon className={`w-8 h-8 ${act.color}`} />
                    </div>
                    <span className="font-semibold text-sm">{act.name}</span>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" zTier="medium">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <act.icon className={`w-5 h-5 ${act.color}`} />
                    Add a new {act.name}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleCreateActivity} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder={`e.g. Week 1 ${act.name}`}
                      required 
                    />
                  </div>
                  
                  {act.id !== 'url' && act.id !== 'resource' && (
                    <div className="space-y-2">
                      <Label>Description / Intro</Label>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={intro}
                        onChange={(e) => setIntro(e.target.value)}
                        placeholder="Instructions for students..."
                      />
                    </div>
                  )}

                  {act.id === 'url' && (
                    <div className="space-y-2">
                      <Label>External URL</Label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {act.id === 'resource' && (
                    <div className="space-y-2">
                      <Label>File Upload</Label>
                      <input 
                        type="file" 
                        className="mt-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-inst-primary/10 file:text-inst-primary hover:file:bg-inst-primary/20" 
                        onChange={handleFileUpload} 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Please enter a Name above before selecting the file.</p>
                    </div>
                  )}

                  {act.id === 'assign' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Grade</Label>
                        <Input type="number" defaultValue={100} />
                      </div>
                    </div>
                  )}

                  {act.id !== 'resource' && (
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" disabled={createActivity.isPending || uploadContent.isPending}>
                        Save and Return to Course
                      </Button>
                    </div>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </FeatureGate>
  )
}
