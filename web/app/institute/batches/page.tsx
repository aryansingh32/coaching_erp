"use client"

import { useState } from "react"
import { Plus, Search, Users, BookOpen } from "lucide-react"
import { useBatches, useCreateBatch } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"
import type { Batch } from "@/lib/api/types"

function getBatchId(batch: Batch) {
  return batch.id ?? batch.name ?? batch.student_group_name ?? ''
}

function getBatchName(batch: Batch) {
  return batch.student_group_name ?? batch.name ?? getBatchId(batch)
}

export default function BatchesPage() {
  const { data: batches, isLoading, isError, refetch } = useBatches()
  const createBatch = useCreateBatch()
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newBatch, setNewBatch] = useState({ name: "", program: "" })

  const filteredBatches = (batches ?? []).filter((b) => {
    const name = getBatchName(b).toLowerCase()
    const id = getBatchId(b).toLowerCase()
    const q = searchTerm.toLowerCase()
    return name.includes(q) || id.includes(q)
  })

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createBatch.mutateAsync({
        name: newBatch.name,
        program: newBatch.program,
      })
      toast.success('Batch created')
      setIsCreateOpen(false)
      setNewBatch({ name: "", program: "" })
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message || 'Failed to create batch')
    }
  }

  if (isLoading) return <LoadingState message="Loading batches..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Batches & Scheduling</h3>
          <p className="text-muted-foreground">Manage student groups from ERPNext Education.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateBatch}>
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>Creates a Student Group in ERPNext.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">Batch Name</label>
                  <Input
                    id="name"
                    value={newBatch.name}
                    onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="program" className="text-sm font-medium">Program</label>
                  <Input
                    id="program"
                    value={newBatch.program}
                    onChange={(e) => setNewBatch({ ...newBatch, program: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBatch.isPending}>
                  {createBatch.isPending ? 'Creating...' : 'Save Batch'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set((batches ?? []).map((b) => b.program).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-institute-border shadow-sm">
        <CardHeader>
          <CardTitle>Batch Roster</CardTitle>
          <CardDescription>All student groups synced from the gateway.</CardDescription>
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

          {!filteredBatches.length ? (
            <EmptyState title="No batches" description="Create a batch to get started." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Academic Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow key={getBatchId(batch)}>
                      <TableCell className="font-mono text-xs">{getBatchId(batch)}</TableCell>
                      <TableCell className="font-medium">{getBatchName(batch)}</TableCell>
                      <TableCell>{batch.program ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{batch.academic_year ?? '—'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
