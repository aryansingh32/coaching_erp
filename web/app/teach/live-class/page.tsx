"use client"

import { useState } from "react"
import Link from "next/link"
import { Video, Play, Square } from "lucide-react"
import { useBatches, useCreateLiveClass, useLiveClasses, useEndLiveClass } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { LoadingState } from "@/components/shared/loading-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function TeachLiveClassPage() {
  const { data: batches, isLoading } = useBatches()
  const { data: meetings, refetch } = useLiveClasses()
  const createLive = useCreateLiveClass()
  const endLive = useEndLiveClass()
  const [selectedBatch, setSelectedBatch] = useState("")
  const [className, setClassName] = useState("")

  const handleStart = async () => {
    if (!selectedBatch) {
      toast.error("Select a batch")
      return
    }
    try {
      const res = await createLive.mutateAsync({
        batchId: selectedBatch,
        name: className || `Live class — ${selectedBatch}`,
      })
      toast.success("Class started")
      await refetch()
      window.open(`/learn/live-class/${res.meetingId}`, "_blank")
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to start class")
    }
  }

  const handleEnd = async (meetingId: string) => {
    try {
      await endLive.mutateAsync(meetingId)
      toast.success("Class ended")
      refetch()
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to end class")
    }
  }

  return (
    <FeatureGate feature="live_classes">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6" /> Live Classes
          </h2>
          <p className="text-muted-foreground">Start or join BigBlueButton sessions for your batches.</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Start a new class</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                  <option value="">Select batch</option>
                  {(batches ?? []).map((b) => {
                    const id = b.name || b.id || ''
                    const label = b.student_group_name || b.name || id
                    return <option key={id} value={id}>{label}</option>
                  })}
                </select>
                <Input
                  placeholder="Class title (optional)"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
                <Button onClick={handleStart} disabled={createLive.isPending}>
                  <Play className="w-4 h-4 mr-2" /> Start class
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Active classes</CardTitle></CardHeader>
          <CardContent>
            {!meetings?.length ? (
              <p className="text-sm text-muted-foreground">No active classes.</p>
            ) : (
              <ul className="space-y-3">
                {meetings.map((m) => (
                  <li key={m.meetingId} className="flex items-center justify-between p-3 rounded-lg bg-slate-100">
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{m.meetingId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" asChild>
                        <Link href={`/learn/live-class/${m.meetingId}`}>Join</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleEnd(m.meetingId)}
                        disabled={endLive.isPending}
                      >
                        <Square className="w-3 h-3 mr-1" /> End
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  )
}
