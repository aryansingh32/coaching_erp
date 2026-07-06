"use client"

import { useEffect, useState, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { useAuthStore } from "@/lib/stores/auth-store"

let socket: Socket | null = null

export function getSocket(token?: string) {
  if (!socket && token) {
    socket = io(process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4000", {
      auth: { token },
      autoConnect: false,
    })
  }
  return socket
}

export function useLiveClassSocket(batchId?: string) {
  const [activeClasses, setActiveClasses] = useState<any[]>([])
  const token = useAuthStore((s) => s.accessToken)
  
  useEffect(() => {
    if (!token) return
    const s = getSocket(token)
    if (!s) return

    if (!s.connected) {
      s.connect()
    }

    const handleStatus = (data: any) => {
      // data: { meetingId, status: 'started' | 'ended', ... }
      setActiveClasses(prev => {
        if (data.status === 'ended') {
          return prev.filter(c => c.meetingId !== data.meetingId)
        }
        
        const exists = prev.find(c => c.meetingId === data.meetingId)
        if (exists) return prev
        
        return [...prev, data]
      })
    }
    
    // Listen for liveclass:status events
    s.on("liveclass:status", handleStatus)

    // Optional: Request initial sync if supported
    // s.emit("liveclass:sync", { batchId })

    return () => {
      s.off("liveclass:status", handleStatus)
    }
  }, [token, batchId])

  return { activeClasses, socket }
}
