import { create } from 'zustand'

type Role = 'student' | 'instructor' | 'parent' | 'admin' | 'super-admin' | null

interface Branding {
  primaryColor: string
  logoUrl?: string
  instituteName?: string
}

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  userId: string | null
  role: Role
  tenantId: string | null
  branding: Branding | null
  login: (token: string, userId: string, role: Role, tenantId: string, branding?: Branding) => void
  logout: () => void
  setBranding: (branding: Branding) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  userId: null,
  role: null,
  tenantId: null,
  branding: null,
  
  login: (accessToken, userId, role, tenantId, branding) => {
    set({
      isAuthenticated: true,
      accessToken,
      userId,
      role,
      tenantId,
      branding: branding || null
    })
    
    // Inject branding CSS variables if provided
    if (branding?.primaryColor) {
      document.documentElement.style.setProperty('--inst-primary', branding.primaryColor)
    }
  },
  
  logout: () => {
    set({
      isAuthenticated: false,
      accessToken: null,
      userId: null,
      role: null,
      tenantId: null,
      branding: null
    })
    document.documentElement.style.removeProperty('--inst-primary')
  },
  
  setBranding: (branding) => {
    set({ branding })
    if (branding.primaryColor) {
      document.documentElement.style.setProperty('--inst-primary', branding.primaryColor)
    }
  }
}))
