'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle2, Circle, AlertCircle, ChevronLeft, ChevronRight, Clock, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { QuizQuestion } from '@/lib/api/types'

// ─── Type helpers ────────────────────────────────────────────────────────────

type AnswerMap = Record<string, string>

function getAnswerKey(slot: number) {
  return `q${slot}:1_answer`
}

// ─── HTML question renderer ───────────────────────────────────────────────────
// Moodle returns HTML for questions — we parse radio/checkbox inputs from it
// to render native accessible React form controls instead of raw HTML.

function parseOptionsFromHtml(html: string): { value: string; label: string }[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const options: { value: string; label: string }[] = []

  // Moodle choice options are <div class="answer"><label>...<input type="radio" value="...">...</label></div>
  const inputs = doc.querySelectorAll('input[type="radio"], input[type="checkbox"]')
  inputs.forEach((input) => {
    const el = input as HTMLInputElement
    const label = input.closest('label')?.textContent?.trim() || el.value
    options.push({ value: el.value, label })
  })

  return options
}

function stripHtml(html: string) {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getQuestionText(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    // Moodle wraps question text in .qtext
    const qtext = doc.querySelector('.qtext, .question-text, p')
    return qtext?.textContent?.trim() || doc.body.textContent?.trim() || ''
  }
  return stripHtml(html)
}

// ─── Question type components ─────────────────────────────────────────────────

function McqQuestion({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion
  value: string
  onChange: (v: string) => void
}) {
  const options = parseOptionsFromHtml(question.html)
  const questionText = getQuestionText(question.html)

  // Fallback: if no radio inputs found in HTML, render a text input
  if (options.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed">{questionText || stripHtml(question.html)}</p>
        <input
          type="text"
          className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Your answer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed">{questionText}</p>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none',
              value === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-muted/50',
            )}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                value === opt.value ? 'border-primary' : 'border-muted-foreground/40',
              )}
            >
              {value === opt.value && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary block" />
              )}
            </span>
            <input
              type="radio"
              name={`q${question.slot}`}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function TrueFalseQuestion({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion
  value: string
  onChange: (v: string) => void
}) {
  const questionText = getQuestionText(question.html)
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed">{questionText || stripHtml(question.html)}</p>
      <div className="flex gap-3">
        {['True', 'False'].map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'px-6 py-2.5 rounded-lg border text-sm font-medium transition-colors',
              value === opt
                ? opt === 'True'
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'bg-red-600 border-red-600 text-white'
                : 'border-border hover:bg-muted/50',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function TextQuestion({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion
  value: string
  onChange: (v: string) => void
}) {
  const questionText = getQuestionText(question.html)
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed">{questionText || stripHtml(question.html)}</p>
      <textarea
        className="flex min-h-[96px] w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        placeholder="Type your answer here…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function QuestionRenderer({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion
  value: string
  onChange: (v: string) => void
}) {
  const type = question.type?.toLowerCase() ?? ''

  if (type.includes('truefalse')) {
    return <TrueFalseQuestion question={question} value={value} onChange={onChange} />
  }
  if (type.includes('essay') || type.includes('shortanswer')) {
    return <TextQuestion question={question} value={value} onChange={onChange} />
  }
  // multichoice (radio) — also handles unknown types (fallback to MCQ)
  return <McqQuestion question={question} value={value} onChange={onChange} />
}

// ─── Timer display ────────────────────────────────────────────────────────────

function TimerBadge({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const called = useRef(false)

  useEffect(() => {
    if (remaining <= 0) {
      if (!called.current) {
        called.current = true
        onExpire()
      }
      return
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, onExpire])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const isWarning = remaining <= 60

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-medium border',
        isWarning
          ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'
          : 'bg-muted/50 border-border text-muted-foreground',
      )}
    >
      <Clock className="w-4 h-4" />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  )
}

// ─── Submit confirmation dialog ───────────────────────────────────────────────

function SubmitDialog({
  open,
  answeredCount,
  totalCount,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  open: boolean
  answeredCount: number
  totalCount: number
  onConfirm: () => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  if (!open) return null
  const unanswered = totalCount - answeredCount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          <h3 className="text-lg font-semibold">Submit Test?</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          You have answered <strong className="text-foreground">{answeredCount}</strong> of{' '}
          <strong className="text-foreground">{totalCount}</strong> questions.
        </p>
        {unanswered > 0 && (
          <p className="text-sm text-amber-600 mb-4">
            {unanswered} question{unanswered > 1 ? 's' : ''} left unanswered.
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Continue
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main QuizInterface component ─────────────────────────────────────────────

export interface QuizInterfaceProps {
  quizName: string
  questions: QuizQuestion[]
  timeLimitSeconds?: number
  isSubmitting?: boolean
  onSubmit: (answers: AnswerMap) => void
}

export function QuizInterface({
  quizName,
  questions,
  timeLimitSeconds,
  isSubmitting = false,
  onSubmit,
}: QuizInterfaceProps) {
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== '').length

  const handleAnswer = useCallback((slot: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [getAnswerKey(slot)]: value }))
  }, [])

  const handleSubmit = useCallback(() => {
    onSubmit(answers)
    setShowConfirm(false)
  }, [answers, onSubmit])

  const handleExpire = useCallback(() => {
    onSubmit(answers)
  }, [answers, onSubmit])

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No questions available.
      </div>
    )
  }

  return (
    <>
      <SubmitDialog
        open={showConfirm}
        answeredCount={answeredCount}
        totalCount={questions.length}
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
        isSubmitting={isSubmitting}
      />

      <div
        className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6"
        aria-label={`Quiz: ${quizName}`}
      >
        {/* ── Question Navigator ───────────────────────────────── */}
        <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Questions</h3>
                <Badge variant="outline" className="text-xs">
                  {answeredCount}/{questions.length}
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, i) => {
                  const answered = !!answers[getAnswerKey(q.slot)]
                  const isCurrent = i === currentIndex
                  return (
                    <button
                      key={q.slot}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      className={cn(
                        'w-full aspect-square rounded-md text-xs font-medium transition-colors flex items-center justify-center',
                        isCurrent
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : answered
                            ? 'bg-green-600/20 text-green-700 dark:text-green-400 border border-green-600/30'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-green-600/20 border border-green-600/30 inline-block" />
                  Answered
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-primary inline-block" />
                  Current
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-muted inline-block" />
                  Not answered
                </div>
              </div>
            </CardContent>
          </Card>

          {timeLimitSeconds && (
            <TimerBadge seconds={timeLimitSeconds} onExpire={handleExpire} />
          )}
        </div>

        {/* ── Question Panel ───────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border py-4 px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                  {currentIndex + 1}
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <p className="text-xs text-muted-foreground capitalize">
                    {currentQuestion.type}
                  </p>
                </div>
                <div className="ml-auto">
                  {answers[getAnswerKey(currentQuestion.slot)] ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-6 px-6">
              <QuestionRenderer
                question={currentQuestion}
                value={answers[getAnswerKey(currentQuestion.slot)] ?? ''}
                onChange={(v) => handleAnswer(currentQuestion.slot, v)}
              />
            </CardContent>
          </Card>

          {/* Navigation & Submit */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="w-4 h-4 mr-1.5" />
                {isSubmitting ? 'Submitting…' : 'Submit Test'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
