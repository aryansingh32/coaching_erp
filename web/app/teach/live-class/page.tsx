"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Video, Play, Square, Calendar, Archive, Users } from "lucide-react"
import { useBatches, useCreateLiveClass, useLiveClasses, useEndLiveClass } from "@/lib/api/hooks"
import { useLiveClassSocket } from "@/lib/api/socket"
import { FeatureGate } from "@/components/shared/feature-gate"
import { LoadingState } from "@/components/shared/loading-state"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { MeetingRecordings } from "./_components/meeting-recordings"

export default function TeachLiveClassPage() {
  const { data: batches, isLoading } = useBatches()
  const { data: meetings, refetch } = useLiveClasses()
  const createLive = useCreateLiveClass()
  const endLive = useEndLiveClass()
  const [selectedBatch, setSelectedBatch] = useState("")
  const [className, setClassName] = useState("")
  
  // Real-time Socket presence
  const { activeClasses: socketClasses } = useLiveClassSocket()
  
  // Merge REST and Socket active classes
  const activeMeetings = [
    ...(meetings || []),
    ...socketClasses.filter(sc => !meetings?.find(m => m.meetingId === sc.meetingId))
  ]

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
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6 text-inst-primary" /> Live Class Manager
          </h2>
          <p className="text-muted-foreground">Manage BigBlueButton sessions, monitor active classes, and access recordings.</p>
        </div>

        <Tabs defaultValue="start" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="start" className="data-[state=active]:bg-background">
              Start Class
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-background">
              Active Sessions
              {activeMeetings.length > 0 && (
                <span className="ml-2 bg-inst-primary text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                  {activeMeetings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="recordings" className="data-[state=active]:bg-background">
              Recording Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="start" className="space-y-6">
            <Card className="border-inst-border shadow-sm max-w-2xl">
              <CardHeader>
                <CardTitle>Launch Instant Class</CardTitle>
                <CardDescription>Select a batch to start an instant BigBlueButton session.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <LoadingState />
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Batch</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-inst-primary"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                      >
                        <option value="">Select a batch...</option>
                        {(batches ?? []).map((b) => {
                          const id = b.name || b.id || ''
                          const label = b.student_group_name || b.name || id
                          return <option key={id} value={id}>{label}</option>
                        })}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Topic (Optional)</label>
                      <Input
                        placeholder="e.g., Chapter 5 Revision"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleStart} disabled={createLive.isPending} className="w-full sm:w-auto">
                      <Play className="w-4 h-4 mr-2 fill-current" /> Launch Class
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card className="border-inst-border shadow-sm">
              <CardHeader>
                <CardTitle>Currently Active Classes</CardTitle>
                <CardDescription>Live sessions currently running across your batches.</CardDescription>
              </CardHeader>
              <CardContent>
                {!activeMeetings?.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <Video className="w-12 h-12 mb-4 opacity-20" />
                    <p>No active classes running right now.</p>
                  </div>
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {activeMeetings.map((m) => (
                      <li key={m.meetingId} className="flex flex-col justify-between p-4 rounded-xl border bg-card hover:border-inst-primary/50 transition-colors shadow-sm">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <p className="font-semibold text-lg leading-tight">{m.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono bg-muted inline-flex px-1.5 py-0.5 rounded">ID: {m.meetingId}</p>
                        </div>
                        <div className="flex gap-3">
                          <Button size="sm" asChild className="flex-1 bg-inst-primary hover:bg-inst-primary/90 text-white">
                            <Link href={`/learn/live-class/${m.meetingId}`}>
                              <Users className="w-4 h-4 mr-2" /> Join
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleEnd(m.meetingId)}
                            disabled={endLive.isPending}
                          >
                            <Square className="w-3 h-3 mr-2 fill-current" /> End
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recordings">
            <Card className="border-inst-border shadow-sm">
              <CardHeader>
                <CardTitle>Recording Library</CardTitle>
                <CardDescription>Access and manage past BigBlueButton session recordings.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100 flex gap-3">
                    <Archive className="w-5 h-5 shrink-0" />
                    <p>Select a past meeting ID below to load its recordings. Only published recordings will be visible to students.</p>
                  </div>
                  
                  {/* Mock meeting ID list, ideally this would be a historical list from backend */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 border-r pr-4">
                      <h4 className="font-medium text-sm">Past Meetings</h4>
                      <MeetingRecordings meetingId="example-meeting-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FeatureGate>
  )
}
