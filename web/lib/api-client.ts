import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from './stores/auth-store'
import type { ApiResponse } from './api/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown> & { message?: string }>) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && !originalRequest.headers['X-Retry']) {
      const { refreshToken, setTokens, logout } = useAuthStore.getState()

      if (refreshToken && !isRefreshing) {
        isRefreshing = true
        try {
          const res = await axios.post<ApiResponse<{ accessToken: string }>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          )
          const newToken = res.data.data.accessToken
          setTokens(newToken)
          originalRequest.headers['X-Retry'] = 'true'
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          isRefreshing = false
          return apiClient(originalRequest)
        } catch {
          isRefreshing = false
          logout()
        }
      } else {
        logout()
      }

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    const payload = error.response?.data
    const message =
      (payload as { message?: string | string[] })?.message ||
      error.message ||
      'Request failed'
    return Promise.reject(
      typeof message === 'string' ? { message } : { message: message.join(', ') }
    )
  }
)

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>(config)
  return response.data.data
}

export function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  return request<T>({ ...config, method: 'GET', url })
}

export function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return request<T>({ ...config, method: 'POST', url, data })
}

export function apiPut<T>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return request<T>({ ...config, method: 'PUT', url, data })
}

export function apiDelete<T>(url: string, config?: AxiosRequestConfig) {
  return request<T>({ ...config, method: 'DELETE', url })
}
