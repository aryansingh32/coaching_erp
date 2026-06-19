"use client"

import { useQuery } from "@tanstack/react-query"
import { proxyErpList } from "@/lib/api/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingState } from "@/components/shared/loading-state"

export default function InstituteGradesPage() {
  const { data: results, isLoading: gradesLoading } = useQuery({
    queryKey: ['proxy', 'Assessment Result'],
    queryFn: () => proxyErpList('Assessment Result'),
  })

  if (gradesLoading) return <LoadingState />

  const gradeRows = (results ?? []) as Array<{
    name: string
    student: string
    program?: string
    course?: string
    total_score?: number
    maximum_score?: number
  }>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Grades & Assessments</h3>
        <p className="text-muted-foreground">Assessment results from ERPNext (replaces Vue Grades.vue).</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assessment Results — {gradeRows.length} records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradeRows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-mono text-xs">{r.student}</TableCell>
                  <TableCell>{r.course ?? '—'}</TableCell>
                  <TableCell>{r.program ?? '—'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {r.total_score ?? '—'}/{r.maximum_score ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
