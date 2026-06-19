import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Branding, UserRole } from '@/lib/api/types'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  erpId: string | null
  displayName: string | null
  role: UserRole | null
  tenantId: string | null
  branding: Branding | null
  linkedStudents: string[]
  activeStudentId: string | null
  features: Record<string, boolean>
  login: (params: {
    accessToken: string
    refreshToken: string
    erpId: string
    displayName: string
    role: UserRole
    tenantId: string
    branding?: Branding
    linkedStudents?: string[]
    features?: Record<string, boolean>
  }) => void
  setFeatures: (features: Record<string, boolean>) => void
  setActiveStudent: (studentId: string) => void
  setTokens: (accessToken: string, refreshToken?: string) => void
  logout: () => void
  setBranding: (branding: Branding) => void
}

function applyBranding(branding?: Branding | null) {
  if (typeof document === 'undefined') return
  if (branding?.primaryColor) {
    document.documentElement.style.setProperty('--inst-primary', branding.primaryColor)
  } else {
    document.documentElement.style.removeProperty('--inst-primary')
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      erpId: null,
      displayName: null,
      role: null,
      tenantId: null,
      branding: null,
      linkedStudents: [],
      activeStudentId: null,
      features: {},

      login: ({ accessToken, refreshToken, erpId, displayName, role, tenantId, branding, linkedStudents, features }) => {
        applyBranding(branding)
        const students = linkedStudents ?? []
        set({
          isAuthenticated: true,
          accessToken,
          refreshToken,
          erpId,
          displayName,
          role,
          tenantId,
          branding: branding ?? null,
          linkedStudents: students,
          activeStudentId: role === 'parent' && students.length ? students[0] : erpId,
          features: features ?? {},
        })
      },

      setFeatures: (features) => set({ features }),

      setActiveStudent: (studentId) => set({ activeStudentId: studentId }),

      setTokens: (accessToken, refreshToken) => {
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        }))
      },

      logout: () => {
        applyBranding(null)
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          erpId: null,
          displayName: null,
          role: null,
          tenantId: null,
          branding: null,
          linkedStudents: [],
          activeStudentId: null,
          features: {},
        })
      },

      setBranding: (branding) => {
        applyBranding(branding)
        set({ branding })
      },
    }),
    {
      name: 'coachingos-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        erpId: state.erpId,
        displayName: state.displayName,
        role: state.role,
        tenantId: state.tenantId,
        branding: state.branding,
        linkedStudents: state.linkedStudents,
        activeStudentId: state.activeStudentId,
        features: state.features,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.branding) applyBranding(state.branding)
      },
    }
  )
)

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case 'super-admin':
    case 'super_admin':
      return '/superadmin/dashboard'
    case 'admin':
      return '/institute/dashboard'
    case 'instructor':
      return '/teach'
    case 'student':
    case 'parent':
      return '/learn'
    default:
      return '/login'
  }
}
