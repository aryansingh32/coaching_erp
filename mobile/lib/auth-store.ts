import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

export type MobileRole = 'student' | 'instructor' | 'parent' | null

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  erpId: string | null
  displayName: string | null
  role: MobileRole
  login: (params: {
    accessToken: string
    refreshToken: string
    erpId: string
    displayName: string
    role: MobileRole
  }) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  erpId: null,
  displayName: null,
  role: null,

  login: async ({ accessToken, refreshToken, erpId, displayName, role }) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    await SecureStore.setItemAsync('role', role ?? '')
    await SecureStore.setItemAsync('erpId', erpId)
    set({ isAuthenticated: true, accessToken, refreshToken, erpId, displayName, role })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    await SecureStore.deleteItemAsync('role')
    await SecureStore.deleteItemAsync('erpId')
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      erpId: null,
      displayName: null,
      role: null,
    })
  },

  hydrate: async () => {
    const accessToken = await SecureStore.getItemAsync('accessToken')
    const refreshToken = await SecureStore.getItemAsync('refreshToken')
    const role = (await SecureStore.getItemAsync('role')) as MobileRole
    const erpId = await SecureStore.getItemAsync('erpId')
    if (accessToken && role) {
      set({ isAuthenticated: true, accessToken, refreshToken, role, erpId })
    }
  },
}))
