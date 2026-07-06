"use client"

import { useState } from "react"
import { useSubmitMoodleAssignment } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UploadCloud, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export function AssignmentUploader({ assignmentId, maxGrade, dueDate }: { assignmentId: number, maxGrade?: number, dueDate?: string }) {
  const submitAssignment = useSubmitMoodleAssignment()
  const [file, setFile] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        await submitAssignment.mutateAsync({
          assignmentId,
          filename: file.name,
          fileBase64: base64
        })
        setSubmitted(true)
        toast.success("Assignment submitted successfully")
      } catch (err: unknown) {
        toast.error((err as { message?: string })?.message || "Failed to submit assignment")
      }
    }
    reader.readAsDataURL(file)
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-green-800">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Submitted for Grading</h3>
          <p className="text-sm">Your file has been successfully uploaded to Moodle.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-inst-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-inst-primary" />
          Submit Assignment
        </CardTitle>
        <CardDescription>
          {dueDate && <span className="block mb-1">Due: {new Date(dueDate).toLocaleString()}</span>}
          {maxGrade && <span className="block">Max Grade: {maxGrade}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-input rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
          <input
            type="file"
            id={`file-upload-${assignmentId}`}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label htmlFor={`file-upload-${assignmentId}`} className="cursor-pointer flex flex-col items-center justify-center">
            <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
            <span className="text-sm font-medium text-inst-primary">Click to browse or drag and drop</span>
            <span className="text-xs text-muted-foreground mt-1">PDF, DOCX, ZIP (Max 10MB)</span>
          </label>
        </div>
        
        {file && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md text-sm">
            <span className="truncate max-w-[80%] font-medium">{file.name}</span>
            <span className="text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        )}

        <Button 
          className="w-full" 
          disabled={!file || submitAssignment.isPending}
          onClick={handleUpload}
        >
          {submitAssignment.isPending ? "Uploading..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  )
}
