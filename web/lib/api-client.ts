import axios from 'axios'
import { useAuthStore } from './stores/auth-store'

// Base URL for the NestJS Gateway API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle 401 Unauthorized (Trigger logout or refresh)
apiClient.interceptors.response.use(
  (response) => response.data, // Unpack the nested response from TransformInterceptor
  async (error) => {
    if (error.response?.status === 401) {
      // In a real app, attempt to refresh token here. 
      // For now, if unauthorized, just log out.
      useAuthStore.getState().logout()
      
      // We can't use next/navigation directly in an interceptor reliably, 
      // so we redirect via window location if in browser
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)
