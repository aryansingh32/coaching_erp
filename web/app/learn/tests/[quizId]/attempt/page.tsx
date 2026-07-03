"use client"

import { use, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  useStartAttempt,
  useAttemptData,
  useSubmitAttempt,
  useTests,
  useLmsCourses,
} from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { CountdownTimer } from "@/components/shared/countdown-timer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import type { MoodleQuiz } from "@/lib/api/types"

function getCourseIds(courses: unknown[]): number[] {
  return courses
    .map((c) => (c as { id?: number }).id)
    .filter((id): id is number => typeof id === 'number' && id > 0)
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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
  const [answers, setAnswers] = useState<Record<string, string>>({})
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

  const handleAnswer = (slot: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [`q${slot}:1_answer`]: value }))
  }

  const handleSubmit = async () => {
    if (!attemptId) return
    try {
      await submitMutation.mutateAsync({ attemptId, answers })
      toast.success('Test submitted')
      router.push(`/learn/tests/${quizId}/review/${attemptId}`)
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Submit failed')
    }
  }

  const questions = attemptData?.questions ?? []

  return (
    <FeatureGate feature="online_tests">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/learn/tests"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold">{quiz?.name ?? `Quiz ${quizId}`}</h2>
              <p className="text-sm text-muted-foreground">Attempt #{attemptId || '…'}</p>
            </div>
          </div>
          {quiz?.timelimit ? (
            <CountdownTimer
              seconds={quiz.timelimit}
              onExpire={() => {
                toast.warning('Time expired — submitting automatically')
                handleSubmit()
              }}
            />
          ) : null}
        </div>

        {(startMutation.isPending || isLoading) && <LoadingState message="Loading questions..." />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoading && !isError && questions.length > 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="space-y-4"
          >
            {questions.map((q) => (
              <Card key={q.slot}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">
                    Q{q.number ?? q.slot}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{stripHtml(q.html)}</p>
                  <input
                    type="text"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Your answer"
                    value={answers[`q${q.slot}:1_answer`] ?? ''}
                    onChange={(e) => handleAnswer(q.slot, e.target.value)}
                  />
                </CardContent>
              </Card>
            ))}
            <Button type="submit" disabled={submitMutation.isPending} className="w-full md:w-auto">
              {submitMutation.isPending ? 'Submitting…' : 'Submit Test'}
            </Button>
          </form>
        )}
      </div>
    </FeatureGate>
  )
}
