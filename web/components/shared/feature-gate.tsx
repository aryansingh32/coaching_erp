'use client'

import { ReactNode } from 'react'
import { useFeatureEnabled } from '@/lib/features'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FeatureGateProps {
  feature: string
  children: ReactNode
  /** When true, hide entirely instead of showing contact message */
  hide?: boolean
  contactHref?: string
}

export function FeatureGate({
  feature,
  children,
  hide = false,
  contactHref = 'mailto:support@coachingos.in',
}: FeatureGateProps) {
  const enabled = useFeatureEnabled(feature)

  if (enabled) return <>{children}</>

  if (hide) return null

  return (
    <Card className="border-dashed">
      <CardContent className="py-10 text-center space-y-4">
        <p className="text-muted-foreground">
          This feature is not included in your institute plan.
        </p>
        <Button asChild variant="outline">
          <Link href={contactHref}>Contact us to enable</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
