'use client'

import { use, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useStartAttempt,
  useAttemptData,
  useSubmitAttempt,
  useTests,
  useLmsCourses,
} from '@/lib/api/hooks'
import { FeatureGate } from '@/components/shared/feature-gate'
import { QuizInterface } from '@/components/learn/QuizInterface'
import { LoadingState } from '@/components/shared/loading-state'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import type { MoodleQuiz } from '@/lib/api/types'

function getCourseIds(courses: unknown[]): number[] {
  return courses
    .map((c) => (c as { id?: number }).id)
    .filter((id): id is number => typeof id === 'number' && id > 0)
}

export default function QuizAttemptPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = use(params)
  const quizIdNum = parseInt(quizId, 10)
  const router = useRouter()

  const { data: courses } = useLmsCourses()
  const courseIds = useMemo(() => getCourseIds(courses ?? []), [courses])
  const { data: tests } = useTests(courseIds)
  const quiz = (tests as MoodleQuiz[] | undefined)?.find((t) => t.id === quizIdNum)

  const startMutation = useStartAttempt()
  const submitMutation = useSubmitAttempt()
  const [attemptId, setAttemptId] = useState(0)
  const initiated = useRef(false)

  const { data: attemptData, isLoading, isError, refetch } = useAttemptData(attemptId)

  useEffect(() => {
    if (initiated.current || quizIdNum <= 0) return
    initiated.current = true
    startMutation.mutateAsync({ quizId: quizIdNum }).then((res) => {
      const id = res.attempt?.id
      if (id) setAttemptId(id)
    }).catch((err: { message?: string }) => {
      toast.error(err?.message || 'Could not start attempt')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizIdNum])

  const handleSubmit = async (answers: Record<string, string>) => {
    if (!attemptId) return
    try {
      await submitMutation.mutateAsync({ attemptId, answers })
      toast.success('Test submitted!')
      router.push(`/learn/tests/${quizId}/review/${attemptId}`)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Submit failed')
    }
  }

  const questions = attemptData?.questions ?? []

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
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{quiz?.name ?? `Quiz ${quizId}`}</h1>
              {attemptId > 0 && (
                <p className="text-xs text-muted-foreground font-mono">
                  Attempt #{attemptId}
                </p>
              )}
            </div>
          </div>
        </div>

        {(startMutation.isPending || (attemptId > 0 && isLoading)) && (
          <LoadingState message={startMutation.isPending ? 'Starting your attempt…' : 'Loading questions…'} />
        )}

        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoading && !isError && questions.length > 0 && (
          <QuizInterface
            quizName={quiz?.name ?? `Quiz ${quizId}`}
            questions={questions}
            timeLimitSeconds={quiz?.timelimit ?? undefined}
            isSubmitting={submitMutation.isPending}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </FeatureGate>
  )
}
