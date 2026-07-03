"use client"

import { useMemo } from "react"
import { useLiveClasses, useMeetingRecordings } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"
import { Play } from "lucide-react"
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

function RecordingCard({ meetingId, meetingName, batchId }: { meetingId: string; meetingName: string; batchId: string }) {
  const { data, isLoading } = useMeetingRecordings(meetingId)
  const raw = data?.recordings?.recording
  const recordings: Recording[] = raw ? (Array.isArray(raw) ? raw : [raw]) : []

  if (isLoading) return null
  if (!recordings.length) return null

  return (
    <>
      {recordings.map((rec) => {
        const url = getPlaybackUrl(rec)
        return (
          <Card key={rec.recordID}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{rec.name || meetingName}</CardTitle>
              <p className="text-xs text-muted-foreground">Batch: {batchId}</p>
            </CardHeader>
            <CardContent className="flex justify-end">
              {url ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4 mr-1" /> Playback
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

export default function TeachRecordingsPage() {
  const { data: classes, isLoading } = useLiveClasses()
  const meetings = useMemo(() => classes ?? [], [classes])

  return (
    <FeatureGate feature="recordings">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold">My Recordings</h3>
          <p className="text-muted-foreground">BBB recordings from your live class sessions.</p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !meetings.length ? (
          <EmptyState title="No recordings" description="Start a live class to generate recordings." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {meetings.map((m) => (
              <RecordingCard
                key={m.meetingId}
                meetingId={m.meetingId}
                meetingName={m.name}
                batchId={m.batchId}
              />
            ))}
          </div>
        )}
      </div>
    </FeatureGate>
  )
}
