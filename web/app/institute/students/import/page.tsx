"use client"

import { useState } from "react"
import { useBulkImportStudents } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Upload, CheckCircle, FileSpreadsheet } from "lucide-react"
import Link from "next/link"

const STEPS = ['Upload CSV', 'Validate', 'Import'] as const

export default function BulkImportPage() {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const importMutation = useBulkImportStudents()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setStep(1)
    }
  }

  const handleImport = async () => {
    if (!file) return
    try {
      await importMutation.mutateAsync(file)
      toast.success('Students imported successfully')
      setStep(2)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Import failed')
    }
  }

  return (
    <FeatureGate feature="bulk_import">
      <div className="space-y-6 max-w-2xl">
        <div>
          <h3 className="text-2xl font-bold">Bulk Student Import</h3>
          <p className="text-muted-foreground">Upload a CSV to onboard students in bulk.</p>
        </div>

        <div className="flex gap-2">
          {STEPS.map((label, i) => (
            <Badge key={label} variant={step >= i ? 'default' : 'secondary'}>
              {i + 1}. {label}
            </Badge>
          ))}
        </div>

        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Step 1 — Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                CSV columns: first_name, last_name, student_email_id, student_mobile_number
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="block w-full text-sm"
              />
            </CardContent>
          </Card>
        )}

        {step === 1 && file && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Step 2 — Validate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Ready to import: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </p>
              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={importMutation.isPending}>
                  {importMutation.isPending ? 'Importing…' : 'Commit Import'}
                </Button>
                <Button variant="outline" onClick={() => { setFile(null); setStep(0) }}>
                  Choose different file
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <p className="font-semibold">Import complete</p>
              <Button asChild>
                <Link href="/institute/students">View Students</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  )
}
