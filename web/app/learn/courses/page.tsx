'use client'

import Link from 'next/link'
import { useBatches } from '@/lib/api/hooks'
import { FeatureGate } from '@/components/shared/feature-gate'
import { PlayCircle, BookOpen, Clock, ChevronRight } from 'lucide-react'
import { LoadingState } from '@/components/shared/loading-state'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import type { Batch } from '@/lib/api/types'
import { cn } from '@/lib/utils'

// Deterministic pastel-ish hue per batch name for the card header
const COURSE_GRADIENTS = [
  'from-blue-500/20 to-violet-500/10',
  'from-green-500/20 to-teal-500/10',
  'from-orange-500/20 to-red-500/10',
  'from-pink-500/20 to-rose-500/10',
  'from-cyan-500/20 to-blue-500/10',
  'from-amber-500/20 to-yellow-500/10',
]

function gradientForBatch(index: number) {
  return COURSE_GRADIENTS[index % COURSE_GRADIENTS.length]
}

function getBatchId(batch: Batch) {
  return batch.id ?? batch.name ?? batch.student_group_name ?? ''
}

function CourseCard({ batch, index }: { batch: Batch; index: number }) {
  const id = getBatchId(batch)
  const name = batch.student_group_name ?? batch.name ?? id
  const gradient = gradientForBatch(index)

  return (
    <Link href={`/learn/courses/${encodeURIComponent(id)}`} className="group">
      <div className="border border-border rounded-2xl overflow-hidden bg-card hover:shadow-lg transition-all duration-200 hover:border-primary/30">
        {/* Card banner */}
        <div className={cn('h-28 flex items-center justify-center bg-gradient-to-br', gradient, 'relative')}>
          <div className="w-14 h-14 rounded-2xl bg-background/60 backdrop-blur-sm flex items-center justify-center shadow-md">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>

          {/* Live dot placeholder — shows if a live class is in progress */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-background/80 text-muted-foreground border-border text-xs backdrop-blur-sm">
              <PlayCircle className="w-3 h-3 mr-1 text-primary" />
              {batch.academic_term ?? 'Current Term'}
            </Badge>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          <h3 className="font-semibold leading-snug mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {batch.program ?? 'Program'}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {batch.academic_year ?? '—'}
            </div>
            <span className="text-primary text-xs font-medium flex items-center gap-0.5 group-hover:gap-1 transition-all">
              Open
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function CoursesPage() {
  const { data: batches, isLoading, isError, refetch } = useBatches()

  if (isLoading) return <LoadingState message="Loading courses…" />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <FeatureGate feature="moodle_lms">
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {batches?.length ?? 0} batches enrolled via ERPNext Education
          </p>
        </div>

        {!batches?.length ? (
          <EmptyState
            title="No courses yet"
            description="You haven't been enrolled in any batches. Contact your institute admin."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch, i) => (
              <CourseCard key={getBatchId(batch)} batch={batch} index={i} />
            ))}
          </div>
        )}
      </div>
    </FeatureGate>
  )
}
