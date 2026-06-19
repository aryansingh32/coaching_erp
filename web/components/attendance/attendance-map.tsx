"use client"

import { useMemo } from "react"
import { format, subDays, startOfWeek, addDays } from "date-fns"
import { useAttendanceReports } from "@/lib/api/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingState } from "@/components/shared/loading-state"
import { EmptyState } from "@/components/shared/empty-state"

export function AttendanceMap({ batchId }: { batchId?: string }) {
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd')
  const { data: reports, isLoading } = useAttendanceReports(batchId ?? '', startDate, endDate)

  const heatmapData = useMemo(() => {
    if (!reports?.length) return []
    return reports.map((r) => {
      const total = r.present + r.absent
      const rate = total > 0 ? Math.round((r.present / total) * 100) : 0
      return { date: new Date(r.date), rate }
    })
  }, [reports])

  const weeks = useMemo(() => {
    if (heatmapData.length === 0) return []
    const firstDate = heatmapData[0].date
    const start = startOfWeek(firstDate)

    const weeksArr: (typeof heatmapData[0] | null)[][] = []
    let currentWeek: (typeof heatmapData[0] | null)[] = []
    let currentDay = start

    while (currentDay < firstDate) {
      currentWeek.push(null)
      currentDay = addDays(currentDay, 1)
    }

    for (const day of heatmapData) {
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(day)
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null)
      weeksArr.push(currentWeek)
    }

    return weeksArr
  }, [heatmapData])

  const getColor = (rate: number | null) => {
    if (!rate) return "bg-muted/20"
    if (rate >= 95) return "bg-institute-success"
    if (rate >= 85) return "bg-institute-success/60"
    if (rate >= 75) return "bg-institute-warning"
    return "bg-institute-danger"
  }

  if (!batchId) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState title="Select a batch" description="Choose a batch to view attendance heatmap." />
        </CardContent>
      </Card>
    )
  }

  if (isLoading) return <LoadingState message="Loading heatmap..." />

  return (
    <Card className="border-institute-border shadow-sm">
      <CardHeader>
        <CardTitle>Attendance Heatmap</CardTitle>
        <CardDescription>From GET /attendance/reports for {batchId}</CardDescription>
      </CardHeader>
      <CardContent>
        {!heatmapData.length ? (
          <EmptyState title="No report data" />
        ) : (
          <>
            <div className="flex justify-start overflow-x-auto pb-4">
              <div className="flex gap-1">
                {weeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col gap-1">
                    {week.map((day, dIndex) => {
                      if (!day) return <div key={dIndex} className="w-3 h-3 rounded-sm bg-transparent" />
                      return (
                        <div
                          key={dIndex}
                          className={`w-3 h-3 rounded-sm ${getColor(day.rate)}`}
                          title={`${format(day.date, "MMM d, yyyy")}: ${day.rate}% present`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
