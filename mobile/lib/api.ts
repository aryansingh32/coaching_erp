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

export async function getBatchStudents(batchId: string) {
  return apiClient.get(`/batches/${batchId}/students`)
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

export async function getStudentAttendance(erpId: string) {
  return apiClient.get(`/attendance/student/${erpId}`)
}

export async function getStudentCourses(erpId: string) {
  return apiClient.get(`/moodle/courses/${erpId}`)
}

export async function getCourseDetails(courseId: string) {
  return apiClient.get(`/moodle/course/${courseId}`)
}

export async function getStudentSchedule(erpId: string) {
  return apiClient.get(`/schedule/student/${erpId}`)
}

export async function getStudentProfile(erpId: string) {
  return apiClient.get(`/students/${erpId}`)
}

export async function getStudentAssessments(erpId: string) {
  return apiClient.get(`/assessments/student/${erpId}`)
}

export async function getAnalyticsEmbedUrl(erpId: string) {
  return apiClient.get(`/analytics/embed-url/${erpId}`)
}

export async function updatePushToken(erpId: string, pushToken: string) {
  return apiClient.post(`/students/${erpId}/push-token`, { pushToken })
}
