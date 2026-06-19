"use client"

import { useMemo } from "react"
import { format, subDays, startOfWeek, addDays } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AttendanceMap({ batchId }: { batchId?: string }) {
  // Generate 90 days of mock attendance density data
  const heatmapData = useMemo(() => {
    const data = []
    for (let i = 89; i >= 0; i--) {
      const date = subDays(new Date(), i)
      // Random attendance rate between 70% and 100%
      const attendanceRate = Math.floor(Math.random() * 30) + 70
      data.push({
        date,
        rate: attendanceRate,
      })
    }
    return data
  }, [batchId])

  // Group by weeks for the grid
  const weeks = useMemo(() => {
    if (heatmapData.length === 0) return []
    const firstDate = heatmapData[0].date
    const startDate = startOfWeek(firstDate)
    
    const weeksArr = []
    let currentWeek = []
    let currentDay = startDate
    
    // Padding start
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
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
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

  return (
    <Card className="border-institute-border shadow-sm">
      <CardHeader>
        <CardTitle>90-Day Attendance Heatmap</CardTitle>
        <CardDescription>
          {batchId ? `Showing density for ${batchId}` : "Showing overall campus density"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-start overflow-x-auto pb-4">
          <div className="flex gap-1">
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-1">
                {week.map((day, dIndex) => {
                  if (!day) return <div key={dIndex} className="w-3 h-3 rounded-sm bg-transparent" />
                  return (
                    <div
                      key={dIndex}
                      className={`w-3 h-3 rounded-sm transition-colors hover:ring-2 hover:ring-ring ${getColor(day.rate)}`}
                      title={`${format(day.date, "MMM d, yyyy")}: ${day.rate}% present`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end space-x-2 mt-2 text-xs text-muted-foreground">
          <span>Lower</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-institute-danger" />
            <div className="w-3 h-3 rounded-sm bg-institute-warning" />
            <div className="w-3 h-3 rounded-sm bg-institute-success/60" />
            <div className="w-3 h-3 rounded-sm bg-institute-success" />
          </div>
          <span>Higher</span>
        </div>
      </CardContent>
    </Card>
  )
}
