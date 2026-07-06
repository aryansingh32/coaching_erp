"use client"

import { useState } from "react"
import { ParentChildSelector, useActiveStudentId } from "@/components/learn/parent-child-selector"
import { useStudentPrograms, useStudentGrades } from "@/lib/api/hooks"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingState } from "@/components/shared/loading-state"

export default function LearnGradesPage() {
  const studentId = useActiveStudentId()
  const { data: programs, isLoading: pLoading } = useStudentPrograms(studentId)
  const [program, setProgram] = useState('')
  const { data: grades, isLoading: gLoading } = useStudentGrades(studentId, program)

  const programList = Array.isArray(programs) ? programs : (programs as { programs?: string[] })?.programs ?? []

  return (
    <div className="space-y-6">
      <ParentChildSelector />
      <div>
        <h2 className="text-3xl font-bold">My Grades</h2>
        <p className="text-muted-foreground">Assessment matrix (Vue Grades.vue parity).</p>
      </div>
      {pLoading ? (
        <LoadingState />
      ) : (
        <>
          {programList.length > 0 && (
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select program" /></SelectTrigger>
              <SelectContent>
                {programList.map((p: string) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {gLoading ? (
            <LoadingState />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {((grades ?? []) as Array<{ name: string; course?: string; total_score?: number; maximum_score?: number }>).map((g) => (
                      <TableRow key={g.name}>
                        <TableCell>{g.name}</TableCell>
                        <TableCell>{g.course ?? '—'}</TableCell>
                        <TableCell className="text-right">{g.total_score}/{g.maximum_score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
