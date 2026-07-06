"use client"

import { useMeetingRecordings } from "@/lib/api/hooks"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { PlayCircle, Download } from "lucide-react"

export function MeetingRecordings({ meetingId }: { meetingId: string }) {
  const { data, isLoading, isError, refetch } = useMeetingRecordings(meetingId)

  if (!meetingId) return <p className="text-sm text-muted-foreground">Select a meeting.</p>
  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  // Handle potential nested array formats from XML->JSON conversions from BBB
  let rawRecordings = data?.recordings?.recording
  if (!rawRecordings) return <p className="text-sm text-muted-foreground">No recordings found for this session.</p>
  
  const recordingsList = Array.isArray(rawRecordings) ? rawRecordings : [rawRecordings]

  return (
    <ul className="space-y-3 mt-4">
      {recordingsList.map((rec) => (
        <li key={rec.recordID} className="flex flex-col gap-2 p-3 border rounded-lg bg-card shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{rec.name}</p>
              <p className="text-xs text-muted-foreground">Published: {rec.published ? 'Yes' : 'No'}</p>
            </div>
            <div className="flex gap-2">
              {rec.playback?.format && (
                <Button size="sm" variant="outline" asChild>
                  <a href={Array.isArray(rec.playback.format) ? rec.playback.format[0].url : rec.playback.format.url} target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="w-4 h-4 mr-1" /> View
                  </a>
                </Button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
