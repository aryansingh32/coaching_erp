'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useBatch, useLmsCourses } from '@/lib/api/hooks'
import { apiGet } from '@/lib/api-client'
import { useQuery } from '@tanstack/react-query'
import { FeatureGate } from '@/components/shared/feature-gate'
import { ProgressRing } from '@/components/shared/progress-ring'
import { LoadingState } from '@/components/shared/loading-state'
import { ErrorState } from '@/components/shared/error-state'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Link2,
  Video,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  ClipboardList,
  MessageSquare,
  FileQuestion,
  LucideProps,
  LayoutTemplate
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssignmentUploader } from '@/components/learn/moodle-activities/AssignmentUploader'
import { DiscussionThread } from '@/components/learn/moodle-activities/DiscussionThread'
import { ScormPlayer } from '@/components/learn/moodle-activities/ScormPlayer'

// ─── Activity icon renderer (static component — avoids dynamic component-in-render) ──
function ActivityIcon({
  modname,
  className,
}: {
  modname: string
  className?: string
}) {
  const lower = modname?.toLowerCase() ?? ''
  const props: LucideProps = { className }
  if (lower === 'quiz') return <ClipboardList {...props} />
  if (lower === 'assign') return <FileQuestion {...props} />
  if (lower === 'forum') return <MessageSquare {...props} />
  if (lower === 'resource') return <FileText {...props} />
  if (lower === 'url') return <Link2 {...props} />
  if (lower === 'folder') return <FolderOpen {...props} />
  if (lower === 'video') return <Video {...props} />
  if (lower === 'label') return <Circle {...props} />
  if (lower === 'scorm') return <LayoutTemplate {...props} />
  // page, book, and default
  return <BookOpen {...props} />
}

function activityBadgeColor(modname: string) {
  const map: Record<string, string> = {
    quiz: 'bg-violet-500/15 text-violet-700 border-violet-500/20',
    assign: 'bg-blue-500/15 text-blue-700 border-blue-500/20',
    forum: 'bg-orange-500/15 text-orange-700 border-orange-500/20',
    resource: 'bg-green-500/15 text-green-700 border-green-500/20',
    url: 'bg-cyan-500/15 text-cyan-700 border-cyan-500/20',
    video: 'bg-red-500/15 text-red-700 border-red-500/20',
    scorm: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/20',
  }
  return map[modname?.toLowerCase()] ?? 'bg-muted/50 text-muted-foreground border-border'
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface MoodleModule {
  id: number
  url?: string
  name: string
  modname: string
  completion?: number
  completiondata?: { state?: number }
  visible?: number
}

interface MoodleSection {
  id: number
  name: string
  summary?: string
  modules?: MoodleModule[]
}

// ─── Activity card ────────────────────────────────────────────────────────────

function ActivityCard({
  mod,
  completed,
}: {
  mod: MoodleModule
  completed: boolean
}) {
  const [open, setOpen] = useState(false)
  const isSpecial = ['assign', 'forum', 'scorm'].includes(mod.modname.toLowerCase())

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all group w-full text-left',
        completed
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-border bg-card hover:border-primary/30 hover:shadow-sm',
      )}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          completed ? 'bg-green-500/15' : 'bg-muted',
        )}
      >
        <ActivityIcon
          modname={mod.modname}
          className={cn('w-4 h-4', completed ? 'text-green-600' : 'text-muted-foreground')}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', completed && 'text-green-700 dark:text-green-400')}>
          {mod.name}
        </p>
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded border text-xs font-medium mt-1 inline-block', activityBadgeColor(mod.modname))}>
          {mod.modname}
        </span>
      </div>

      {completed ? (
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0 group-hover:text-primary/30 transition-colors" />
      )}
    </div>
  )

  if (isSpecial) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inst-primary rounded-lg">{content}</button>
        </DialogTrigger>
        <DialogContent className={cn("sm:max-w-3xl", mod.modname.toLowerCase() === 'scorm' ? 'p-0 border-0 bg-transparent shadow-none sm:max-w-5xl' : '')} zTier="medium">
          {mod.modname.toLowerCase() !== 'scorm' && (
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ActivityIcon modname={mod.modname} className="w-5 h-5 text-inst-primary" />
                {mod.name}
              </DialogTitle>
            </DialogHeader>
          )}
          <div className={mod.modname.toLowerCase() !== 'scorm' ? 'mt-4' : ''}>
            {mod.modname.toLowerCase() === 'assign' && <AssignmentUploader assignmentId={mod.id} />}
            {mod.modname.toLowerCase() === 'forum' && <DiscussionThread forumId={mod.id} forumName={mod.name} />}
            {mod.modname.toLowerCase() === 'scorm' && <ScormPlayer launchUrl={mod.url || ''} title={mod.name} />}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <a
      href={mod.url ?? '#'}
      target={mod.url ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inst-primary rounded-lg"
    >
      {content}
    </a>
  )
}

// ─── Section accordion ────────────────────────────────────────────────────────

function SectionAccordion({
  section,
  defaultOpen = false,
}: {
  section: MoodleSection
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const mods = section.modules?.filter((m) => m.visible !== 0) ?? []
  const completedCount = mods.filter(
    (m) => m.completiondata?.state === 1 || m.completion === 1,
  ).length
  const progress = mods.length > 0 ? Math.round((completedCount / mods.length) * 100) : 0

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left focus:outline-none focus-visible:bg-muted/60"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{section.name || `Section ${section.id}`}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount}/{mods.length} activities · {progress}% complete
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {mods.length > 0 && (
            <ProgressRing value={progress} size="sm" color="primary" />
          )}
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="p-3 space-y-2 bg-background">
          {mods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activities in this section.
            </p>
          ) : (
            mods.map((mod) => (
              <ActivityCard
                key={mod.id}
                mod={mod}
                completed={mod.completiondata?.state === 1 || mod.completion === 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = use(params)
  const id = decodeURIComponent(batchId)
  const { data: batch, isLoading: batchLoading, isError, refetch } = useBatch(id)

  // Try to find a matching Moodle course by batch name
  const { data: lmsCourses } = useLmsCourses()
  const batchName = batch?.student_group_name ?? batch?.name ?? id
  const matchedCourse = (lmsCourses as { id?: number; fullname?: string }[] | undefined)?.find(
    (c) => c.fullname?.toLowerCase().includes(batchName.toLowerCase()) || c.fullname === batchName,
  )

  const courseId = matchedCourse?.id

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ['lms-content', courseId],
    queryFn: () => apiGet<MoodleSection[]>(`/lms/courses/${courseId}/content`),
    enabled: !!courseId,
  })

  const sections = (content as MoodleSection[] | undefined) ?? []
  const allMods = sections.flatMap((s) => s.modules?.filter((m) => m.visible !== 0) ?? [])
  const completedTotal = allMods.filter(
    (m) => m.completiondata?.state === 1 || m.completion === 1,
  ).length
  const overallProgress =
    allMods.length > 0 ? Math.round((completedTotal / allMods.length) * 100) : 0

  if (batchLoading) return <LoadingState message="Loading course…" />
  if (isError || !batch) return <ErrorState onRetry={() => refetch()} />

  return (
    <FeatureGate feature="moodle_lms">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
            <Link href="/learn/courses">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-tight">
              {batch.student_group_name ?? batch.name ?? id}
            </h1>
            {batch.program && (
              <Badge variant="outline" className="mt-1">
                {batch.program}
              </Badge>
            )}
          </div>
          {allMods.length > 0 && (
            <ProgressRing value={overallProgress} size="xl" color="primary" showValue />
          )}
        </div>

        {/* Batch meta */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Academic Year', value: batch.academic_year },
            { label: 'Term', value: batch.academic_term },
            { label: 'Activities', value: allMods.length > 0 ? `${completedTotal}/${allMods.length}` : '—' },
          ].map((m) => (
            <Card key={m.label}>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="font-semibold text-sm mt-0.5">{m.value ?? '—'}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Moodle content */}
        {contentLoading ? (
          <LoadingState message="Loading course content from Moodle…" />
        ) : sections.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Course Content
            </h2>
            {sections.map((section, i) => (
              <SectionAccordion key={section.id} section={section} defaultOpen={i === 0} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {courseId
                  ? 'No content sections found in Moodle for this course.'
                  : 'No Moodle course matched. Contact your instructor to link course content.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  )
}
