'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, getRoleHomePath } from '@/lib/stores/auth-store'
import type { UserRole } from '@/lib/api/types'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, role } = useAuthStore()
  const hydrated = useHydrated()

  useEffect(() => {
    if (!hydrated) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.replace(getRoleHomePath(role))
    }
  }, [hydrated, isAuthenticated, role, allowedRoles, router])

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (allowedRoles && role && !allowedRoles.includes(role)) return null

  return <>{children}</>
}
