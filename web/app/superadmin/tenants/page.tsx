"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useTenants, useCreateTenant } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"

export default function TenantsPage() {
  const { data: tenants, isLoading, isError, refetch } = useTenants()
  const createTenant = useCreateTenant()
  const [name, setName] = useState("")
  const [open, setOpen] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTenant.mutateAsync({ name })
      toast.success(`Tenant "${name}" provisioned`)
      setName("")
      setOpen(false)
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message || 'Failed to create tenant')
    }
  }

  if (isLoading) return <LoadingState message="Loading tenants..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Tenants</h3>
          <p className="text-muted-foreground">Manage coaching institutes on the platform.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-platform-accent hover:bg-platform-accent/90">
              <Plus className="mr-2 h-4 w-4" /> Provision Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New Institute</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Institute name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createTenant.isPending}>
                  {createTenant.isPending ? 'Provisioning...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-platform-surface border-platform-border">
        <CardHeader>
          <CardTitle>All Institutes</CardTitle>
        </CardHeader>
        <CardContent>
          {!tenants?.length ? (
            <EmptyState title="No tenants yet" description="Provision your first coaching institute to get started." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-mono text-xs">{tenant.id}</TableCell>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {tenant.status ?? 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/superadmin/tenants/${tenant.id}`}>Manage</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
