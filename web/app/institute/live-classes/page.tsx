"use client"

import { useState } from "react"
import { useLiveClasses, useCreateLiveClass } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { Video, Plus, Play, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function InstituteLiveClassesPage() {
  const { data: classes, isLoading, isError, refetch } = useLiveClasses()
  const createMutation = useCreateLiveClass()
  
  const [isCreating, setIsCreating] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [selectedBatch, setSelectedBatch] = useState("")

  const handleCreate = async () => {
    if (!newClassName || !selectedBatch) {
      toast.error("Please enter a name and batch ID")
      return
    }
    
    try {
      await createMutation.mutateAsync({ name: newClassName, batchId: selectedBatch })
      toast.success("Live class scheduled successfully")
      setIsCreating(false)
      setNewClassName("")
      setSelectedBatch("")
      refetch()
    } catch (e: unknown) {
      toast.error((e as { message?: string }).message || "Failed to schedule class")
    }
  }

  if (isLoading) return <LoadingState message="Loading live classes..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const classList = classes ?? []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Live Classes</h3>
          <p className="text-muted-foreground">Manage BigBlueButton sessions and recordings.</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" />
          {isCreating ? "Cancel" : "Schedule Class"}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-institute-border shadow-sm mb-6 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Schedule New Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Session Name</label>
                <Input 
                  placeholder="e.g. Math Revision" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Batch ID</label>
                <Input 
                  placeholder="e.g. BATCH-001" 
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  className="w-full" 
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Scheduling..." : "Create Session"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {classList.length === 0 ? (
        <Card className="border-dashed shadow-none bg-transparent">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No live classes found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Schedule your first BigBlueButton live class to start teaching interactively.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classList.map((cls, idx) => (
            <Card key={cls.meetingId ?? idx} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-institute-border/40">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{cls.name || 'Untitled Class'}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Batch: {cls.batchId}</p>
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                    ACTIVE
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    {cls.meetingId}
                  </div>
                  <Button variant="secondary" size="sm">
                    <Play className="mr-2 h-4 w-4" /> Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
