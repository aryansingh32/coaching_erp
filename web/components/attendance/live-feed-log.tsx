"use client"

import { memo } from "react"
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { useRealTimeAttendance } from "@/hooks/useRealTimeAttendance"

interface LiveFeedLogProps {
  selectedBatch: string
}

const LiveFeedLog = memo(({ selectedBatch }: LiveFeedLogProps) => {
  const { isConnected, livePunches } = useRealTimeAttendance(selectedBatch)

  const displayPunches = livePunches.length > 0 ? livePunches : [
    { studentId: "STU-001", batchId: selectedBatch, status: "Present", timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), method: "rfid" },
    { studentId: "STU-042", batchId: selectedBatch, status: "Present", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), method: "rfid" },
    { studentId: "STU-018", batchId: selectedBatch, status: "Late", timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), method: "manual" },
    { studentId: "STU-105", batchId: selectedBatch, status: "Present", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), method: "rfid" },
  ] as const

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-muted-foreground">Recent Scans</h4>
        <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center ${isConnected ? 'bg-institute-success/10 text-institute-success' : 'bg-institute-warning/10 text-institute-warning'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-institute-success animate-pulse' : 'bg-institute-warning'}`} />
          {isConnected ? "Connected" : "Reconnecting..."}
        </div>
      </div>
      <div className="space-y-6">
        {displayPunches.map((punch, idx) => {
          const time = new Date(punch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          return (
            <div key={idx} className="flex items-start space-x-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="mt-0.5">
                {punch.status === "Present" && <CheckCircle2 className="w-5 h-5 text-institute-success" />}
                {punch.status === "Late" && <Clock className="w-5 h-5 text-institute-warning" />}
                {punch.status === "Absent" && <AlertTriangle className="w-5 h-5 text-institute-danger" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Student <span className="font-mono text-muted-foreground">{punch.studentId}</span>
                </p>
                <div className="flex items-center text-xs text-muted-foreground space-x-2">
                  <span>{time}</span>
                  <span>•</span>
                  <span className="capitalize">{punch.method} Scan</span>
                </div>
              </div>
              <div className="text-xs font-semibold px-2 py-1 rounded-md bg-muted">
                {punch.batchId}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

LiveFeedLog.displayName = "LiveFeedLog"
export { LiveFeedLog }
