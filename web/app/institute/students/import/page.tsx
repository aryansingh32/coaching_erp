'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useBulkImportStudents } from '@/lib/api/hooks'
import { FeatureGate } from '@/components/shared/feature-gate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, CheckCircle2, FileSpreadsheet, ArrowLeft, ArrowRight, X, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataTable } from '@/components/ui/data-table'

const STEPS = [
  { label: 'Upload CSV', desc: 'Select your student data file' },
  { label: 'Preview', desc: 'Verify the data before committing' },
  { label: 'Import', desc: 'Records committed to ERPNext' },
]

const REQUIRED_COLUMNS = ['first_name', 'last_name', 'student_email_id', 'student_mobile_number']

function parseCSVHeaders(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const firstLine = text.split('\n')[0] ?? ''
      const headers = firstLine.split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''))
      resolve(headers)
    }
    reader.readAsText(file)
  })
}

function parseCSVRows(file: File, limit = 5): Promise<string[][]> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').slice(1, limit + 1)
      const rows = lines.map((line) =>
        line.split(',').map((cell) => cell.trim().replace(/['"]/g, '')),
      )
      resolve(rows.filter((r) => r.some(Boolean)))
    }
    reader.readAsText(file)
  })
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                i < current
                  ? 'bg-green-600 border-green-600 text-white'
                  : i === current
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground',
              )}
            >
              {i < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-xs mt-1 font-medium whitespace-nowrap',
              i === current ? 'text-primary' : 'text-muted-foreground',
            )}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'w-16 md:w-24 h-0.5 mb-4 transition-colors',
              i < current ? 'bg-green-600' : 'bg-border',
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function BulkImportPage() {
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const importMutation = useBulkImportStudents()

  const handleFileSelect = async (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file')
      return
    }
    setFile(f)
    const [h, rows] = await Promise.all([parseCSVHeaders(f), parseCSVRows(f)])
    setHeaders(h)
    setPreviewRows(rows)
    setStep(1)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  const handleImport = async () => {
    if (!file) return
    try {
      await importMutation.mutateAsync(file)
      toast.success('Students imported successfully!')
      setStep(2)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Import failed')
    }
  }

  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col))

  return (
    <FeatureGate feature="bulk_import">
      <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/institute/students">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bulk Student Import</h1>
            <p className="text-muted-foreground text-sm">
              Upload a CSV file to onboard multiple students at once.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center py-2">
          <StepIndicator current={step} />
        </div>

        {/* ─── Step 0: Upload ──────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            {/* Drag-drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30',
              )}
            >
              <Upload className={cn('w-12 h-12 mx-auto mb-4', isDragging ? 'text-primary' : 'text-muted-foreground/50')} />
              <p className="font-semibold mb-1">
                {isDragging ? 'Drop your CSV here' : 'Drag & drop your CSV file here'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <Button variant="outline" type="button">
                Browse files
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelect(f)
                }}
              />
            </div>

            {/* Column guide */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Expected CSV columns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {REQUIRED_COLUMNS.map((col) => (
                    <code key={col} className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {col}
                    </code>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Only <code className="bg-muted px-1 rounded">first_name</code> is mandatory. Other fields are optional.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Step 1: Preview ─────────────────────────────── */}
        {step === 1 && file && (
          <div className="space-y-4">
            {/* File info */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setFile(null); setHeaders([]); setPreviewRows([]); setStep(0) }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Column validation */}
            {missingColumns.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Missing optional columns detected:</p>
                  <p>{missingColumns.join(', ')}</p>
                  <p className="text-xs mt-1 opacity-80">These fields will be left blank for imported students.</p>
                </div>
              </div>
            )}

            {/* Data preview table */}
            {previewRows.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Data Preview (first {previewRows.length} rows)</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <div className="p-4">
                    <DataTable 
                      columns={headers.map(h => ({ accessorKey: h, header: h }))}
                      data={previewRows.map(row => {
                        const obj: Record<string, string> = {}
                        headers.forEach((h, i) => {
                          obj[h] = row[i] || ''
                        })
                        return obj
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleImport} disabled={importMutation.isPending}>
                {importMutation.isPending ? (
                  <>Importing…</>
                ) : (
                  <>
                    Commit Import
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setFile(null); setHeaders([]); setPreviewRows([]); setStep(0) }}
              >
                Choose different file
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Done ────────────────────────────────── */}
        {step === 2 && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold">Import complete!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Students from <strong>{file?.name}</strong> have been committed to ERPNext.
                </p>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/institute/students">View Students</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setFile(null); setHeaders([]); setPreviewRows([]); setStep(0) }}
                >
                  Import another file
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  )
}
