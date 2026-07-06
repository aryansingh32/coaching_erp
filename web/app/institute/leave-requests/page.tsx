'use client'

import { useState, useMemo } from 'react'
import { useLeaveRequests, useUpdateLeaveRequest } from '@/lib/api/hooks'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingState } from '@/components/shared/loading-state'
import { ErrorState } from '@/components/shared/error-state'
import { DataTable } from '@/components/ui/data-table'
import { CheckCircle2, XCircle, Clock, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { LeaveRequest } from '@/lib/api/types'
import { ColumnDef } from '@tanstack/react-table'

function statusBadge(status?: string) {
  if (status === 'Approved') {
    return (
      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20 text-xs">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
      </Badge>
    )
  }
  if (status === 'Rejected') {
    return (
      <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 text-xs">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs">
      <Clock className="w-3 h-3 mr-1" /> Pending
    </Badge>
  )
}

function isPending(req: LeaveRequest) {
  return !req.status || req.status === 'Open' || req.status === 'Pending'
}

export default function LeaveRequestsPage() {
  const { data: requests, isLoading, isError, refetch } = useLeaveRequests()
  const updateLeave = useUpdateLeaveRequest()
  const [activeTab, setActiveTab] = useState('pending')

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await updateLeave.mutateAsync({ id, status })
      toast.success(`Leave request ${status.toLowerCase()}`)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Action failed')
    }
  }

  const columns = useMemo<ColumnDef<LeaveRequest>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 rounded border-gray-300"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4 rounded border-gray-300"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'student',
      header: 'Student',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold">{row.original.student}</span>
          {row.original.student_group && (
            <span className="text-xs text-muted-foreground">{row.original.student_group}</span>
          )}
        </div>
      )
    },
    {
      id: 'dates',
      header: 'Dates',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.from_date} <span className="text-muted-foreground px-1">→</span> {row.original.to_date}
        </span>
      )
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <span className="text-sm italic line-clamp-1">{row.original.reason || '—'}</span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => statusBadge(row.original.status)
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        if (!isPending(row.original)) return null
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
              disabled={updateLeave.isPending}
              onClick={() => handleAction(row.original.name, 'Approved')}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              disabled={updateLeave.isPending}
              onClick={() => handleAction(row.original.name, 'Rejected')}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Reject
            </Button>
          </div>
        )
      }
    }
  ], [updateLeave.isPending])

  if (isLoading) return <LoadingState message="Loading leave requests…" />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const list = (requests ?? []) as LeaveRequest[]
  const pending = list.filter(isPending)
  const approved = list.filter((r) => r.status === 'Approved')
  const rejected = list.filter((r) => r.status === 'Rejected')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          Leave Requests
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Review and approve student leave applications.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', count: pending.length, color: 'text-amber-500' },
          { label: 'Approved', count: approved.length, color: 'text-green-500' },
          { label: 'Rejected', count: rejected.length, color: 'text-red-500' },
        ].map((s) => (
          <Card key={s.label} className="text-center shadow-sm">
            <CardContent className="pt-4 pb-4">
              <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {(
          [
            ['pending', pending],
            ['approved', approved],
            ['rejected', rejected],
            ['all', list],
          ] as [string, LeaveRequest[]][]
        ).map(([tab, items]) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="bg-background rounded-lg border shadow-sm p-4">
              <DataTable 
                columns={columns} 
                data={items} 
                searchKey="student"
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
