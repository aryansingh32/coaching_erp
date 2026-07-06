'use client'

import { useState, useMemo } from 'react'
import {
  useInstructors,
  useCreateInstructor,
  useDeactivateInstructor,
} from '@/lib/api/hooks'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { LoadingState } from '@/components/shared/loading-state'
import { ErrorState } from '@/components/shared/error-state'
import { DataTable } from '@/components/ui/data-table'
import {
  Plus,
  UserMinus,
  Mail,
  Phone,
  UserCog,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Instructor } from '@/lib/api/types'
import { ColumnDef } from '@tanstack/react-table'

export default function StaffPage() {
  const { data: instructors, isLoading, isError, refetch } = useInstructors()
  const createInstructor = useCreateInstructor()
  const deactivate = useDeactivateInstructor()
  const [open, setOpen] = useState(false)
  
  const [form, setForm] = useState({
    instructor_name: '',
    cell_number: '',
    email_address: '',
  })

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createInstructor.mutateAsync(form)
      toast.success('Instructor added successfully')
      setOpen(false)
      setForm({ instructor_name: '', cell_number: '', email_address: '' })
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed to add instructor')
    }
  }

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Deactivate ${name}?`)) return
    try {
      await deactivate.mutateAsync(id)
      toast.success('Instructor deactivated')
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Failed')
    }
  }

  const columns = useMemo<ColumnDef<Instructor>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 rounded border-gray-300"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 rounded border-gray-300"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'instructor_name',
      header: 'Instructor',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar fallback={row.original.instructor_name} size="sm" className={row.original.status === 'Left' ? 'grayscale' : ''} />
          <div className="flex flex-col">
            <span className="font-semibold">{row.original.instructor_name}</span>
            <span className="text-xs text-muted-foreground font-mono">{row.original.name}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email_address',
      header: 'Contact Info',
      cell: ({ row }) => (
        <div className="flex flex-col space-y-1">
          {row.original.email_address ? (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" /> {row.original.email_address}
            </span>
          ) : <span className="text-xs text-muted-foreground">—</span>}
          {row.original.cell_number && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" /> {row.original.cell_number}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isLeft = row.original.status === 'Left'
        return (
          <Badge 
            variant={isLeft ? 'secondary' : 'default'} 
            className={!isLeft ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20' : ''}
          >
            {isLeft ? 'Left' : 'Active'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const isLeft = row.original.status === 'Left'
        if (isLeft) return null
        return (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => handleDeactivate(row.original.name, row.original.instructor_name)}
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          </div>
        )
      },
    }
  ], [])

  if (isLoading) return <LoadingState message="Loading staff directory…" />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const list = (instructors ?? []) as Instructor[]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" />
            Staff &amp; Instructors
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your teaching staff.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Instructor
        </Button>
      </div>

      <div className="bg-background rounded-lg border shadow-sm p-4">
        <DataTable 
          columns={columns} 
          data={list} 
          searchKey="instructor_name"
        />
      </div>

      {/* Add Instructor Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Instructor
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="inst-name">Full Name *</Label>
                <Input
                  id="inst-name"
                  value={form.instructor_name}
                  onChange={(e) => setForm({ ...form, instructor_name: e.target.value })}
                  placeholder="e.g. Dr. Priya Sharma"
                  required
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="inst-phone">Phone</Label>
                  <Input
                    id="inst-phone"
                    value={form.cell_number}
                    onChange={(e) => setForm({ ...form, cell_number: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="inst-email">Email</Label>
                  <Input
                    id="inst-email"
                    type="email"
                    value={form.email_address}
                    onChange={(e) => setForm({ ...form, email_address: e.target.value })}
                    placeholder="priya@example.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInstructor.isPending}>
                {createInstructor.isPending ? 'Adding…' : 'Add Instructor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
