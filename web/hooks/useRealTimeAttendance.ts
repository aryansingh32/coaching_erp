"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useAuthStore } from "@/lib/stores/auth-store"

interface AttendanceEvent {
  studentId: string
  batchId: string
  status: "Present" | "Absent" | "Late"
  timestamp: string
  rfidCard?: string
  method: "rfid" | "manual"
}

// Ensure the socket URL points to the NestJS Gateway
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'

export function useRealTimeAttendance(batchId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [livePunches, setLivePunches] = useState<AttendanceEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const { accessToken } = useAuthStore()

  useEffect(() => {
    if (!accessToken) return

    // Connect to the /attendance namespace on the gateway
    const socketInstance = io(`${SOCKET_URL}/attendance`, {
      auth: {
        token: accessToken
      },
      transports: ["websocket"]
    })

    socketInstance.on("connect", () => {
      setIsConnected(true)
      // If a specific batch is selected, join its room
      if (batchId) {
        socketInstance.emit("join_batch", { batchId })
      }
    })

    socketInstance.on("disconnect", () => {
      setIsConnected(false)
    })

    // Listen for real-time punches coming from the NATS worker via the gateway
    socketInstance.on("new_punch", (data: AttendanceEvent) => {
      setLivePunches((prev) => [data, ...prev].slice(0, 50)) // Keep last 50
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [accessToken, batchId])

  return { isConnected, livePunches, socket }
}
