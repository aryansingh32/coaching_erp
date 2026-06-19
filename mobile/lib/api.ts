import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data ?? error)
)

export async function sendOtp(phone: string, role: string) {
  return apiClient.post('/auth/send-otp', { phone, role })
}

export async function verifyOtp(phone: string, otp: string, role: string) {
  return apiClient.post('/auth/verify-otp', { phone, otp, role })
}

export async function listBatches() {
  return apiClient.get('/batches')
}

export async function getStudentTimeline(erpId: string) {
  return apiClient.get(`/students/${erpId}/timeline`)
}

export async function getPendingFees(studentId: string) {
  return apiClient.get(`/fees/pending/${studentId}`)
}

export async function markManualAttendance(data: {
  studentId: string
  date: string
  status: string
  batchId: string
}) {
  return apiClient.post('/attendance/manual', data)
}
