"use client"

import { use, useEffect, useState } from "react"
import { useJoinLiveClass } from "@/lib/api/hooks"
import { useAuthStore } from "@/lib/stores/auth-store"
import { FeatureGate } from "@/components/shared/feature-gate"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LiveClassPage({
  params,
}: {
  params: Promise<{ meetingId: string }>
}) {
  const { meetingId } = use(params)
  const displayName = useAuthStore((s) => s.displayName) ?? 'Student'
  const joinMutation = useJoinLiveClass()
  const [joinUrl, setJoinUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    joinMutation.mutateAsync({ meetingId, fullName: displayName }).then((res) => {
      if (!cancelled) setJoinUrl(res.joinUrl)
    }).catch(() => {
      if (!cancelled) setJoinUrl(null)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, displayName])

  return (
    <FeatureGate feature="live_classes">
      <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 md:-m-8">
        <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/learn"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="font-semibold">Live Class</h1>
            <p className="text-xs text-muted-foreground font-mono">{meetingId}</p>
          </div>
        </header>

        {joinMutation.isPending && <LoadingState />}
        {joinMutation.isError && !joinMutation.isPending && (
          <ErrorState onRetry={() => joinMutation.mutate({ meetingId, fullName: displayName })} />
        )}
        {joinUrl && (
          <iframe
            src={joinUrl}
            className="flex-1 w-full border-0 bg-black"
            allow="camera; microphone; display-capture; fullscreen"
            title="Live class"
          />
        )}
      </div>
    </FeatureGate>
  )
}
