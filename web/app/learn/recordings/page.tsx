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

  if (isLoading) return <LoadingState message="Loading recordings..." />
  if (!recordings.length) return null

  return (
    <>
      {recordings.map((rec) => {
        const url = getPlaybackUrl(rec)
        return (
          <Card key={rec.recordID}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" />
                {rec.name || meetingName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-mono">{meetingId}</p>
              {url ? (
                <Button size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4 mr-1" /> Watch
                  </a>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Processing…</span>
              )}
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
