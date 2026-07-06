"use client"

import { use, useEffect, useState } from "react"
import { useJoinLiveClass } from "@/lib/api/hooks"
import { useAuthStore } from "@/lib/stores/auth-store"
import { FeatureGate } from "@/components/shared/feature-gate"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, ZoomIn, ZoomOut, AlertTriangle, ShieldCheck } from "lucide-react"

export default function LiveClassPage({
  params,
}: {
  params: Promise<{ meetingId: string }>
}) {
  const { meetingId } = use(params)
  const displayName = useAuthStore((s) => s.displayName) ?? 'Student'
  const joinMutation = useJoinLiveClass()
  const [joinUrl, setJoinUrl] = useState<string | null>(null)
  const [fontScaleLevel, setFontScaleLevel] = useState(2) // Default scale 2 (1rem)
  
  const fontScales = [
    'var(--font-scale-1)', // 0.875rem
    'var(--font-scale-2)', // 1rem
    'var(--font-scale-3)', // 1.25rem
    'var(--font-scale-4)', // 1.5rem
    'var(--font-scale-5)'  // 2rem
  ]

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

  const increaseFont = () => setFontScaleLevel(prev => Math.min(prev + 1, 4))
  const decreaseFont = () => setFontScaleLevel(prev => Math.max(prev - 1, 0))

  return (
    <FeatureGate feature="live_classes">
      <div 
        className="flex flex-col h-[calc(100vh-6rem)] -m-6 md:-m-8 transition-all duration-200"
        style={{ fontSize: fontScales[fontScaleLevel] }}
      >
        {/* Custom Header Chrome Overlay */}
        <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0 z-10 shadow-sm relative">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href="/learn"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div className="flex flex-col">
              <h1 className="font-semibold leading-tight flex items-center gap-2">
                Live Class
                <ShieldCheck className="w-4 h-4 text-green-500" />
              </h1>
              <p className="text-xs text-muted-foreground font-mono">ID: {meetingId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
              <Button variant="ghost" size="icon" onClick={decreaseFont} className="h-7 w-7" disabled={fontScaleLevel === 0}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium px-2">Aa</span>
              <Button variant="ghost" size="icon" onClick={increaseFont} className="h-7 w-7" disabled={fontScaleLevel === 4}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Deep Navy Loading Shell & Iframe Wrapper */}
        <div className="flex-1 w-full relative bg-[var(--bbb-navy)]">
          {joinMutation.isPending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <LoadingState message="Connecting to secure classroom..." />
            </div>
          )}
          
          {joinMutation.isError && !joinMutation.isPending && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-background">
              <ErrorState onRetry={() => joinMutation.mutate({ meetingId, fullName: displayName })} />
            </div>
          )}
          
          {joinUrl && (
            <>
              {/* Compatibility Warning Banner (Simulated feature from spec) */}
              <div className="absolute top-0 left-0 w-full bg-[var(--bbb-warning)] text-red-900 text-xs py-1 px-4 text-center z-0 animate-in slide-in-from-top-2 duration-500 delay-1000 hidden md:block opacity-90">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Please ensure microphone and camera permissions are allowed.
              </div>
              
              <iframe
                src={joinUrl}
                className="w-full h-full border-0 relative z-10"
                allow="camera; microphone; display-capture; fullscreen"
                title="Live class"
              />
            </>
          )}
        </div>
      </div>
    </FeatureGate>
  )
}
