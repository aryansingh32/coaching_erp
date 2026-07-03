'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  /** Total seconds allowed */
  seconds: number
  onExpire?: () => void
}

export function CountdownTimer({ seconds, onExpire }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.()
      return
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(id)
  }, [remaining, onExpire])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const urgent = remaining <= 60

  return (
    <Badge variant={urgent ? 'destructive' : 'secondary'} className="gap-1">
      <Clock className="w-3 h-3" />
      {mins}:{secs.toString().padStart(2, '0')}
    </Badge>
  )
}
