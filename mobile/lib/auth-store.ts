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
  linkedStudents: string[]
  activeStudentId: string | null
  login: (params: {
    accessToken: string
    refreshToken: string
    erpId: string
    displayName: string
    role: MobileRole
    linkedStudents?: string[]
  }) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  setActiveStudent: (studentId: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  erpId: null,
  displayName: null,
  role: null,
  linkedStudents: [],
  activeStudentId: null,

  login: async ({ accessToken, refreshToken, erpId, displayName, role, linkedStudents }) => {
    await SecureStore.setItemAsync('accessToken', accessToken)
    await SecureStore.setItemAsync('refreshToken', refreshToken)
    await SecureStore.setItemAsync('role', role ?? '')
    await SecureStore.setItemAsync('erpId', erpId)
    
    if (linkedStudents && linkedStudents.length > 0) {
      await SecureStore.setItemAsync('linkedStudents', JSON.stringify(linkedStudents))
      await SecureStore.setItemAsync('activeStudentId', linkedStudents[0])
    }
    
    set({ 
      isAuthenticated: true, 
      accessToken, 
      refreshToken, 
      erpId, 
      displayName, 
      role,
      linkedStudents: linkedStudents || [],
      activeStudentId: linkedStudents && linkedStudents.length > 0 ? linkedStudents[0] : erpId
    })
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken')
    await SecureStore.deleteItemAsync('refreshToken')
    await SecureStore.deleteItemAsync('role')
    await SecureStore.deleteItemAsync('erpId')
    await SecureStore.deleteItemAsync('linkedStudents')
    await SecureStore.deleteItemAsync('activeStudentId')
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      erpId: null,
      displayName: null,
      role: null,
      linkedStudents: [],
      activeStudentId: null
    })
  },

  hydrate: async () => {
    const accessToken = await SecureStore.getItemAsync('accessToken')
    const refreshToken = await SecureStore.getItemAsync('refreshToken')
    const role = (await SecureStore.getItemAsync('role')) as MobileRole
    const erpId = await SecureStore.getItemAsync('erpId')
    
    const linkedStudentsStr = await SecureStore.getItemAsync('linkedStudents')
    const activeStudentIdStr = await SecureStore.getItemAsync('activeStudentId')
    
    const linkedStudents = linkedStudentsStr ? JSON.parse(linkedStudentsStr) : []
    const activeStudentId = activeStudentIdStr || erpId
    
    if (accessToken && role) {
      set({ 
        isAuthenticated: true, 
        accessToken, 
        refreshToken, 
        role, 
        erpId,
        linkedStudents,
        activeStudentId
      })
    }
  },

  setActiveStudent: (studentId: string) => {
    SecureStore.setItemAsync('activeStudentId', studentId)
    set({ activeStudentId: studentId })
  }
}))
