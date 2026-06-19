"use client"

import { useState } from "react"
import { useTests } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"

export default function ExamsPage() {
  const [courseIds, setCourseIds] = useState('1')
  const ids = courseIds.split(',').map((id) => parseInt(id.trim(), 10)).filter(Boolean)
  const { data: tests, isLoading, isError } = useTests(ids)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Exams & Moodle Tests</h3>
        <p className="text-muted-foreground">Quizzes from Moodle via GET /tests?courseIds=</p>
      </div>
      <Input
        placeholder="Moodle course IDs (comma-separated)"
        value={courseIds}
        onChange={(e) => setCourseIds(e.target.value)}
        className="max-w-md"
      />
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <EmptyState title="Failed to load tests" description="Ensure Moodle is running and course IDs are valid." />
      ) : !tests?.length ? (
        <EmptyState title="No quizzes found" />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Time Limit</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tests as Array<{ id: number; name: string; course: number; timelimit?: number; grade?: number }>).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell><Badge variant="outline">{t.course}</Badge></TableCell>
                    <TableCell>{t.timelimit ? `${Math.round(t.timelimit / 60)} min` : '—'}</TableCell>
                    <TableCell>{t.grade ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
