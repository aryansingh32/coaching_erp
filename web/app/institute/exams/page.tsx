"use client"

import { useState } from "react"
import { Search, Plus, Calendar, FileText, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const MOCK_EXAMS = [
  { id: "EXM-001", name: "JEE Mains Mock Test 1", batch: "BCH-A-24", date: "2024-05-10", type: "Objective", status: "Completed", avgScore: "68%" },
  { id: "EXM-002", name: "NEET Unit 4", batch: "BCH-B-24", date: "2024-05-15", type: "Objective", status: "Upcoming", avgScore: "-" },
  { id: "EXM-003", name: "10th Board Math Preboard", batch: "BCH-C-24", date: "2024-04-20", type: "Subjective", status: "Completed", avgScore: "82%" },
  { id: "EXM-004", name: "JEE Advanced Full Syllabus", batch: "BCH-A-24", date: "2024-06-01", type: "Objective", status: "Upcoming", avgScore: "-" },
]

export default function ExamsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [exams, setExams] = useState(MOCK_EXAMS)

  const [newExam, setNewExam] = useState({ name: "", batch: "", date: "", type: "Objective" })

  const filteredExams = exams.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.batch.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `EXM-NEW-${Math.floor(Math.random() * 1000)}`
    setExams([...exams, { ...newExam, id, status: "Upcoming", avgScore: "-" }])
    setIsCreateOpen(false)
    setNewExam({ name: "", batch: "", date: "", type: "Objective" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-institute-text-primary">Exams & Assessments</h3>
          <p className="text-muted-foreground">Schedule tests, manage syllabi, and analyze batch performance.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-institute-primary text-primary-foreground hover:bg-institute-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Schedule Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateExam}>
              <DialogHeader>
                <DialogTitle>Schedule New Exam</DialogTitle>
                <DialogDescription>
                  Set up a new test for a specific batch.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Exam Name</label>
                  <Input value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} placeholder="e.g. Unit 1 Physics Test" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Target Batch</label>
                  <Input value={newExam.batch} onChange={e => setNewExam({...newExam, batch: e.target.value})} placeholder="e.g. BCH-A-24" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Type (Objective/Subjective)</label>
                  <Input value={newExam.type} onChange={e => setNewExam({...newExam, type: e.target.value})} placeholder="Objective" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit">Schedule</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.filter(e => e.status === "Upcoming").length}</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Exams</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-institute-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.filter(e => e.status === "Completed").length}</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Institute Score</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-primary">76.4%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-institute-border shadow-sm">
        <CardHeader>
          <CardTitle>Assessment Records</CardTitle>
          <CardDescription>View upcoming and completed assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-mono text-xs">{exam.id}</TableCell>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>{exam.batch}</TableCell>
                    <TableCell>{new Date(exam.date).toLocaleDateString()}</TableCell>
                    <TableCell>{exam.type}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={exam.status === "Completed" ? "bg-institute-success/10 text-institute-success" : "bg-institute-warning/10 text-institute-warning"}>
                        {exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{exam.avgScore}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
