'use client'

import { use } from 'react'
import Link from 'next/link'
import { useAttemptReview } from '@/lib/api/hooks'
import { FeatureGate } from '@/components/shared/feature-gate'
import { ProgressRing } from '@/components/shared/progress-ring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/shared/loading-state'
import { ErrorState } from '@/components/shared/error-state'
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

function stripHtml(html: string) {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const qtext = doc.querySelector('.qtext, p')
    return qtext?.textContent?.trim() || doc.body.textContent?.trim() || ''
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function stateConfig(state?: string) {
  if (state === 'gradedright') {
    return {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10 border-green-500/20',
      label: 'Correct',
    }
  }
  if (state === 'gradedwrong' || state === 'gradedpartial') {
    return {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10 border-red-500/20',
      label: state === 'gradedpartial' ? 'Partial' : 'Incorrect',
    }
  }
  return {
    icon: MinusCircle,
    color: 'text-muted-foreground',
    bg: 'bg-muted/30 border-border',
    label: 'Pending',
  }
}

export default function QuizReviewPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>
}) {
  const { quizId, attemptId } = use(params)
  const attemptIdNum = parseInt(attemptId, 10)
  const { data: review, isLoading, isError, refetch } = useAttemptReview(attemptIdNum)

  const rawScore = review?.attempt?.sumgrades ?? review?.grade
  const questions = review?.questions ?? []
  const totalMax = questions.reduce((s, q) => s + (q.maxmark ?? 1), 0)
  const scorePercent = totalMax > 0 && rawScore !== undefined
    ? Math.round((Number(rawScore) / totalMax) * 100)
    : undefined

  const correctCount = questions.filter((q) => q.state === 'gradedright').length
  const wrongCount = questions.filter(
    (q) => q.state === 'gradedwrong' || q.state === 'gradedpartial',
  ).length

  return (
    <FeatureGate feature="online_tests">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/learn/tests">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Test Review
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Quiz {quizId} · Attempt {attemptId}
            </p>
          </div>
        </div>

        {isLoading && <LoadingState message="Loading review…" />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoading && !isError && (
          <>
            {/* Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-center">
                {scorePercent !== undefined ? (
                  <ProgressRing
                    value={scorePercent}
                    size="xl"
                    color={scorePercent >= 60 ? 'success' : 'danger'}
                    showValue
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">—</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center space-y-2">
                <h2 className="text-xl font-bold">
                  {rawScore !== undefined
                    ? `Score: ${rawScore}${totalMax > 0 ? ` / ${totalMax}` : ''}`
                    : 'Awaiting grading'}
                </h2>
                {questions.length > 0 && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" /> {correctCount} correct
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle className="w-4 h-4" /> {wrongCount} incorrect
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MinusCircle className="w-4 h-4" />{' '}
                      {questions.length - correctCount - wrongCount} pending
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Question Review */}
            {questions.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Question Details
                </h3>
                {questions.map((q, i) => {
                  const state = stateConfig(q.state)
                  const StateIcon = state.icon
                  return (
                    <Card key={q.slot} className={cn('border', state.bg)}>
                      <CardHeader className="pb-2 py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-xs font-bold shrink-0">
                            {i + 1}
                          </div>
                          <CardTitle className="text-sm font-medium flex-1">
                            {stripHtml(q.html).slice(0, 120)}
                            {stripHtml(q.html).length > 120 ? '…' : ''}
                          </CardTitle>
                          <div className="flex items-center gap-2 shrink-0">
                            {q.mark !== undefined && q.maxmark !== undefined && (
                              <Badge
                                variant="outline"
                                className={cn('text-xs', state.color, 'border-current/30')}
                              >
                                {q.mark}/{q.maxmark}
                              </Badge>
                            )}
                            <StateIcon className={cn('w-5 h-5', state.color)} />
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-muted-foreground text-sm">
                  Detailed review will appear once your instructor grades the attempt.
                </CardContent>
              </Card>
            )}

            <Button asChild>
              <Link href="/learn/tests">Back to Tests</Link>
            </Button>
          </>
        )}
      </div>
    </FeatureGate>
  )
}
