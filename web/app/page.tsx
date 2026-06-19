"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"

export default function RootPage() {
  const router = useRouter()
  const { isAuthenticated, role } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Role-based redirection
    if (role === "admin") {
      router.push("/institute/dashboard")
    } else if (role === "super-admin") {
      router.push("/superadmin")
    } else if (role === "student" || role === "parent") {
      router.push("/learn")
    } else if (role === "instructor") {
      router.push("/teach")
    } else {
      router.push("/login")
    }
  }, [isAuthenticated, role, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse">Loading CoachingOS...</p>
      </div>
    </div>
  )
}
