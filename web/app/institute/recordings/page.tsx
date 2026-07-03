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
    const p = playback.find((x) => x.type === 'presentation') ?? playback[0]
    return p?.url ?? null
  }
  return playback.url ?? null
}

function RecordingRow({ meetingId, name, batchId }: { meetingId: string; name: string; batchId: string }) {
  const { data, isLoading } = useMeetingRecordings(meetingId)
  const raw = data?.recordings?.recording
  const recordings: Recording[] = raw ? (Array.isArray(raw) ? raw : [raw]) : []
  if (isLoading || !recordings.length) return null
  return (
    <>
      {recordings.map((rec) => {
        const url = getPlaybackUrl(rec)
        return (
          <Card key={rec.recordID}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{rec.name || name}</CardTitle>
              <p className="text-xs text-muted-foreground">Batch {batchId}</p>
            </CardHeader>
            <CardContent className="flex justify-end">
              {url ? (
                <Button size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4 mr-1" /> Play
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

export default function InstituteRecordingsPage() {
  const { data: classes, isLoading } = useLiveClasses()
  const meetings = useMemo(() => classes ?? [], [classes])

  return (
    <FeatureGate feature="recordings">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold">Class Recordings</h3>
          <p className="text-muted-foreground">BBB recordings across all batches.</p>
        </div>
        {isLoading ? (
          <LoadingState />
        ) : !meetings.length ? (
          <EmptyState title="No recordings" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meetings.map((m) => (
              <RecordingRow key={m.meetingId} meetingId={m.meetingId} name={m.name} batchId={m.batchId} />
            ))}
          </div>
        )}
      </div>
    </FeatureGate>
  )
}
