"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CalendarEvent {
  date: string // YYYY-MM-DD
  type: 'present' | 'absent' | 'late' | 'holiday' | 'class' | 'exam'
  title?: string
}

export function CalendarView({
  events = [],
  onDateClick,
}: {
  events?: CalendarEvent[]
  onDateClick?: (date: string, events: CalendarEvent[]) => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  
  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getEventsForDate = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'present': return 'bg-green-500'
      case 'absent': return 'bg-red-500'
      case 'late': return 'bg-orange-500'
      case 'holiday': return 'bg-purple-500'
      case 'class': return 'bg-blue-500'
      case 'exam': return 'bg-rose-600'
      default: return 'bg-gray-400'
    }
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b bg-muted/20">
        <h3 className="font-semibold text-lg">{monthNames[month]} {year}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="bg-background min-h-[100px] p-2" />
          }
          
          const dayEvents = getEventsForDate(day)
          const isToday = 
            day === new Date().getDate() && 
            month === new Date().getMonth() && 
            year === new Date().getFullYear()

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            
          return (
            <div 
              key={`day-${day}`} 
              className={cn(
                "bg-background min-h-[100px] p-2 relative group hover:bg-muted/10 transition-colors cursor-pointer",
                isToday && "bg-primary/5"
              )}
              onClick={() => onDateClick?.(dateStr, dayEvents)}
            >
              <span className={cn(
                "inline-flex items-center justify-center w-7 h-7 text-sm rounded-full",
                isToday ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground group-hover:text-foreground font-medium"
              )}>
                {day}
              </span>
              
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 3).map((e, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-1.5 text-[10px] sm:text-xs truncate"
                    title={e.title || e.type}
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", getEventColor(e.type))} />
                    <span className="truncate hidden sm:inline">{e.title || e.type}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-3.5">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
