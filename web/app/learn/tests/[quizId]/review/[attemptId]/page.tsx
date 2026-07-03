"use client"

import { use } from "react"
import Link from "next/link"
import { useAttemptReview } from "@/lib/api/hooks"
import { FeatureGate } from "@/components/shared/feature-gate"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingState } from "@/components/shared/loading-state"
import { ErrorState } from "@/components/shared/error-state"
import { ArrowLeft, CheckCircle } from "lucide-react"

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function QuizReviewPage({
  params,
}: {
  params: Promise<{ quizId: string; attemptId: string }>
}) {
  const { quizId, attemptId } = use(params)
  const attemptIdNum = parseInt(attemptId, 10)
  const { data: review, isLoading, isError, refetch } = useAttemptReview(attemptIdNum)

  const score = review?.attempt?.sumgrades ?? review?.grade
  const questions = review?.questions ?? []

  return (
    <FeatureGate feature="online_tests">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/learn/tests"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Test Submitted
            </h2>
            <p className="text-sm text-muted-foreground">Quiz {quizId} · Attempt {attemptId}</p>
          </div>
        </div>

        {isLoading && <LoadingState message="Loading review..." />}
        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoading && !isError && (
          <>
            {score !== undefined && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Your score</p>
                  <p className="text-4xl font-bold">{score}</p>
                </CardContent>
              </Card>
            )}

            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((q) => (
                  <Card key={q.slot}>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Question {q.slot}</CardTitle>
                      {q.mark !== undefined && q.maxmark !== undefined && (
                        <Badge variant={q.state === 'gradedright' ? 'default' : 'secondary'}>
                          {q.mark}/{q.maxmark}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{stripHtml(q.html)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-muted-foreground text-sm">
                  Review details will appear once your instructor grades the attempt.
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
