"use client"

import { useState, useMemo } from "react"
import { useLmsCourses, useMoodleGradeItems, useSaveMoodleGrades, useBatchStudents, useBatches } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { FeatureGate } from "@/components/shared/feature-gate"

export default function MoodleGradebookPage() {
  const { data: courses, isLoading: coursesLoading } = useLmsCourses()
  const { data: batches } = useBatches()
  
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedBatch, setSelectedBatch] = useState<string>('')
  
  const courseId = parseInt(selectedCourse, 10)
  const { data: gradeItems, isLoading: itemsLoading } = useMoodleGradeItems(courseId)
  const { data: students, isLoading: studentsLoading } = useBatchStudents(selectedBatch)
  const saveGrades = useSaveMoodleGrades()
  
  // Local state for inline grading spreadsheet
  // Record<studentId, Record<itemId, grade>>
  const [draftGrades, setDraftGrades] = useState<Record<string, Record<number, string>>>({})

  const handleGradeChange = (studentId: string, itemId: number, value: string) => {
    setDraftGrades(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [itemId]: value
      }
    }))
  }

  const handleSaveAll = async () => {
    if (!courseId || !gradeItems) return

    const gradesPayload = []
    for (const [studentErpId, itemGrades] of Object.entries(draftGrades)) {
      // Mock converting student ERP ID to Moodle numeric user ID (e.g., hash or fallback)
      const numericUserId = parseInt(studentErpId.replace(/\D/g, '') || '1', 10)
      
      for (const [itemIdStr, gradeValue] of Object.entries(itemGrades)) {
        if (gradeValue !== '') {
          gradesPayload.push({
            userid: numericUserId,
            itemid: parseInt(itemIdStr, 10),
            grade: parseFloat(gradeValue)
          })
        }
      }
    }
    
    if (!gradesPayload.length) {
      toast.info("No grades modified")
      return
    }
    
    try {
      await saveGrades.mutateAsync({ courseId, grades: gradesPayload })
      toast.success('Grades saved to Moodle Gradebook')
      setDraftGrades({})
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to save grades')
    }
  }
  
  const isLoading = coursesLoading || (selectedCourse && itemsLoading) || (selectedBatch && studentsLoading)

  // Default empty list if no items
  const items = gradeItems || []
  const studentList = students || []

  return (
    <FeatureGate feature="grades">
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-inst-primary" /> Gradebook Setup
            </h3>
            <p className="text-muted-foreground">Manage Moodle grader report spreadsheet.</p>
          </div>
          <Button onClick={handleSaveAll} disabled={saveGrades.isPending || !selectedCourse || !selectedBatch}>
            <Save className="w-4 h-4 mr-2" />
            {saveGrades.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="py-4">
              <span className="text-sm font-medium">1. Select Moodle Course</span>
            </CardHeader>
            <CardContent>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Course..." />
                </SelectTrigger>
                <SelectContent>
                  {(courses as any[])?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.fullname || c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <span className="text-sm font-medium">2. Select Student Batch</span>
            </CardHeader>
            <CardContent>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Batch..." />
                </SelectTrigger>
                <SelectContent>
                  {(batches as any[])?.map((b) => {
                    const id = b.name ?? b.student_group_name ?? ''
                    return (
                      <SelectItem key={id} value={id}>
                        {b.student_group_name ?? b.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Card className="border-inst-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12"><LoadingState /></div>
            ) : !selectedCourse || !selectedBatch ? (
              <div className="p-12 text-center text-muted-foreground">Select a course and batch to load the spreadsheet.</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[200px] border-r font-semibold">Student</TableHead>
                    {items.length === 0 && <TableHead className="text-muted-foreground italic">No grade items configured</TableHead>}
                    {items.map(item => (
                      <TableHead key={item.id} className="min-w-[120px] text-center border-r">
                        <div className="flex flex-col">
                          <span className="truncate" title={item.itemname}>{item.itemname}</span>
                          <span className="text-xs text-muted-foreground font-normal">Max: {item.grademax}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="min-w-[100px] text-center font-bold">Course Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentList.map(s => {
                    // Calculate mock total based on draft or fallback grades
                    let total = 0;
                    items.forEach(item => {
                      const val = draftGrades[s.student]?.[item.id]
                      if (val && !isNaN(parseFloat(val))) total += parseFloat(val)
                    })
                    
                    return (
                      <TableRow key={s.student} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="border-r font-medium">
                          {s.student_name || s.student}
                          <div className="text-xs text-muted-foreground font-mono">{s.student}</div>
                        </TableCell>
                        
                        {items.length === 0 && <TableCell />}
                        
                        {items.map(item => (
                          <TableCell key={item.id} className="border-r p-2 bg-background">
                            <Input 
                              type="number"
                              className="h-8 text-center border-transparent hover:border-input focus:border-inst-primary focus:ring-1 focus:ring-inst-primary transition-all"
                              placeholder="-"
                              max={item.grademax}
                              value={draftGrades[s.student]?.[item.id] || ''}
                              onChange={(e) => handleGradeChange(s.student, item.id, e.target.value)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold bg-muted/20">
                          {total > 0 ? total : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </FeatureGate>
  )
}
