"use client"

import { useMemo } from "react"
import { useLiveClasses, useMeetingRecordings } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Play, Video } from "lucide-react"
import type { Recording } from "@/lib/api/types"

function getPlaybackUrl(recording: Recording): string | null {
  const playback = recording.playback?.format
  if (!playback) return null
  if (Array.isArray(playback)) {
    const presentation = playback.find((p) => p.type === 'presentation') ?? playback[0]
    return presentation?.url ?? null
  }
  return playback.url ?? null
}

function RecordingCard({ meetingId, meetingName }: { meetingId: string; meetingName: string }) {
  const { data, isLoading } = useMeetingRecordings(meetingId)
  const raw = data?.recordings?.recording
  const recordings: Recording[] = raw ? (Array.isArray(raw) ? raw : [raw]) : []

  // Filter out unpublished recordings for students
  const publishedRecordings = recordings.filter(r => r.published)

  if (isLoading) return <LoadingState message="Loading recordings..." />
  if (!publishedRecordings.length) return null

  return (
    <>
      {publishedRecordings.map((rec) => {
        const url = getPlaybackUrl(rec)
        return (
          <Card key={rec.recordID} className="border-inst-border shadow-sm hover:border-inst-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="w-5 h-5 text-inst-primary" />
                {rec.name || meetingName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">ID: {meetingId}</p>
                <span className="text-[10px] uppercase font-bold tracking-wider text-inst-primary bg-inst-primary/10 px-2 py-1 rounded-full">
                  Published
                </span>
              </div>
              
              <div className="flex justify-end pt-2 border-t">
                {url ? (
                  <Button size="sm" asChild className="w-full sm:w-auto">
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Play className="w-4 h-4 mr-2" /> Watch Recording
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled className="w-full sm:w-auto">
                    Processing…
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}

export default function LearnRecordingsPage() {
  const { data: classes, isLoading } = useLiveClasses()
  const meetings = useMemo(() => classes ?? [], [classes])

  return (
    <FeatureGate feature="recordings">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Past Classes</h2>
          <p className="text-muted-foreground">Recordings from your live class sessions.</p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !meetings.length ? (
          <EmptyState title="No recordings yet" description="Recordings appear after live classes end." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {meetings.map((m) => (
              <RecordingCard key={m.meetingId} meetingId={m.meetingId} meetingName={m.name} />
            ))}
          </div>
        )}
      </div>
    </FeatureGate>
  )
}
