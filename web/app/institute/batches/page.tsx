"use client"

import { useState } from "react"
import { Plus, Search, Calendar, Users, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Mock Data
const INITIAL_BATCHES = [
  { id: "BCH-A-24", name: "IIT JEE Advanced", course: "Physics", instructor: "Dr. Sharma", timings: "08:00 AM - 10:00 AM", students: 42, status: "Active" },
  { id: "BCH-B-24", name: "NEET Target", course: "Biology", instructor: "Prof. Verma", timings: "10:30 AM - 12:30 PM", students: 55, status: "Active" },
  { id: "BCH-C-24", name: "Foundation 10th", course: "Mathematics", instructor: "Mr. Gupta", timings: "04:00 PM - 06:00 PM", students: 38, status: "Active" },
  { id: "BCH-D-24", name: "Board Revision", course: "Chemistry", instructor: "Dr. Singh", timings: "06:30 PM - 08:30 PM", students: 60, status: "Upcoming" },
]

export default function BatchesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [batches, setBatches] = useState(INITIAL_BATCHES)

  // Form State
  const [newBatch, setNewBatch] = useState({ name: "", course: "", instructor: "", timings: "" })

  const filteredBatches = batches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.course.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `BCH-NEW-${Math.floor(Math.random() * 1000)}`
    setBatches([...batches, { ...newBatch, id, students: 0, status: "Upcoming" }])
    setIsCreateOpen(false)
    setNewBatch({ name: "", course: "", instructor: "", timings: "" })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-institute-text-primary">Batches & Scheduling</h3>
          <p className="text-muted-foreground">Manage classes, assign instructors, and track batch capacity.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-institute-primary text-primary-foreground hover:bg-institute-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateBatch}>
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>
                  Configure a new batch, assign a course, and set timings.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">Batch Name</label>
                  <Input id="name" value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} placeholder="e.g. IIT JEE Advanced" required />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="course" className="text-sm font-medium">Course Subject</label>
                  <Input id="course" value={newBatch.course} onChange={e => setNewBatch({...newBatch, course: e.target.value})} placeholder="e.g. Physics" required />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="instructor" className="text-sm font-medium">Instructor</label>
                  <Input id="instructor" value={newBatch.instructor} onChange={e => setNewBatch({...newBatch, instructor: e.target.value})} placeholder="e.g. Dr. Sharma" required />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="timings" className="text-sm font-medium">Timings</label>
                  <Input id="timings" value={newBatch.timings} onChange={e => setNewBatch({...newBatch, timings: e.target.value})} placeholder="e.g. 08:00 AM - 10:00 AM" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit">Save Batch</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {batches.reduce((sum, b) => sum + b.students, 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-institute-border shadow-sm">
        <CardHeader>
          <CardTitle>Batch Roster</CardTitle>
          <CardDescription>View and manage all active and upcoming batches.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
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
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Timings</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono text-xs">{batch.id}</TableCell>
                    <TableCell className="font-medium">{batch.name}</TableCell>
                    <TableCell>{batch.course}</TableCell>
                    <TableCell>{batch.instructor}</TableCell>
                    <TableCell className="text-muted-foreground">{batch.timings}</TableCell>
                    <TableCell className="text-right font-medium">{batch.students}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={batch.status === "Active" ? "bg-institute-success/10 text-institute-success" : "bg-muted"}>
                        {batch.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBatches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No batches found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
