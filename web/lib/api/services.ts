import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client'
import type {
  AttendanceReport,
  Batch,
  DashboardEmbed,
  HealthStatus,
  Kpis,
  PendingFee,
  Student,
  Tenant,
  TimelineEvent,
  VerifyOtpResult,
} from './types'

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string, role: string) {
  return apiPost<{ message: string }>('/auth/send-otp', { phone, role })
}

export async function verifyOtp(phone: string, otp: string, role: string) {
  return apiPost<VerifyOtpResult>('/auth/verify-otp', { phone, otp, role })
}

export async function googleLogin(token: string) {
  return apiPost<VerifyOtpResult>('/auth/google', { token })
}

export async function googleRegister(token: string, role: string, phone: string) {
  return apiPost<{ message: string }>('/auth/google/register', { token, role, phone })
}

export async function refreshToken(token: string) {
  return apiPost<{ accessToken: string }>('/auth/refresh', { refreshToken: token })
}

export async function logoutApi(refreshToken: string) {
  return apiPost<{ message: string }>('/auth/logout', { refreshToken })
}

// ─── Students ───────────────────────────────────────────────────────────────

export async function listStudents() {
  return apiGet<Student[]>('/students')
}

export async function getStudent(erpId: string) {
  return apiGet<Student & { id?: string }>(`/students/${erpId}`)
}

export async function createStudent(data: {
  first_name: string
  last_name?: string
  student_email_id?: string
  student_mobile_number?: string
  guardian?: Record<string, unknown>
}) {
  return apiPost<Student>('/students', data)
}

export async function updateStudent(
  erpId: string,
  data: { first_name?: string; last_name?: string }
) {
  return apiPut(`/students/${erpId}`, data)
}

export async function bulkImportStudents(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost('/students/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function assignRfid(erpId: string, rfidCard: string) {
  return apiPost(`/students/${erpId}/rfid-card`, { rfidCard })
}

export async function getStudentTimeline(erpId: string) {
  return apiGet<TimelineEvent[]>(`/students/${erpId}/timeline`)
}

// ─── Batches ────────────────────────────────────────────────────────────────

export async function listBatches() {
  return apiGet<Batch[]>('/batches')
}

export async function getBatch(id: string) {
  return apiGet<Batch>(`/batches/${id}`)
}

export async function createBatch(data: {
  name: string
  program: string
  academic_term?: string
  academic_year?: string
}) {
  return apiPost<Batch>('/batches', data)
}

export async function enrollStudent(batchId: string, studentId: string) {
  return apiPost(`/batches/${batchId}/enroll`, { studentId })
}

export async function scheduleBatch(
  batchId: string,
  data: { days: string[]; startTime: string; endTime: string }
) {
  return apiPost(`/batches/${batchId}/schedule`, data)
}

export async function assignInstructor(batchId: string, instructorId: string) {
  return apiPost(`/batches/${batchId}/instructors`, { instructorId })
}

export async function getBatchStudents(batchId: string) {
  return apiGet<Array<{ student: string; student_name?: string; group_roll_number?: string }>>(
    `/batches/${encodeURIComponent(batchId)}/students`,
  )
}

// ─── Attendance ─────────────────────────────────────────────────────────────

export async function markManualAttendance(data: {
  studentId: string
  date: string
  status: string
  batchId: string
}) {
  return apiPost('/attendance/manual', data)
}

export async function getAttendanceReports(
  batchId: string,
  startDate: string,
  endDate: string
) {
  return apiGet<AttendanceReport[]>('/attendance/reports', {
    params: { batchId, startDate, endDate },
  })
}

// ─── Fees ───────────────────────────────────────────────────────────────────

export async function getPendingFees(studentId: string) {
  return apiGet<PendingFee[]>(`/fees/pending/${studentId}`)
}

export async function recordPayment(data: {
  studentId: string
  amount: number
  referenceNumber: string
}) {
  return apiPost('/fees/payment', data)
}

export async function generateFeeSchedule(data: {
  studentId: string
  feeStructure: string
}) {
  return apiPost('/fees/schedule', data)
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export async function getKpis(tenantId?: string) {
  return apiGet<Kpis>('/analytics/kpis', { params: { tenantId } })
}

export async function getDashboardEmbed(id: number, tenantId?: string) {
  return apiGet<DashboardEmbed>(`/analytics/dashboard/${id}`, { params: { tenantId } })
}

// ─── Tenants ────────────────────────────────────────────────────────────────

export async function listTenants() {
  return apiGet<Tenant[]>('/tenants')
}

export async function getTenant(id: string) {
  return apiGet<Tenant>(`/tenants/${id}`)
}

export async function createTenant(data: Record<string, unknown>) {
  return apiPost<Tenant>('/tenants', data)
}

export async function updateTenant(id: string, data: Record<string, unknown>) {
  return apiPut<Tenant>(`/tenants/${id}`, data)
}

export async function disableTenant(id: string) {
  return apiDelete(`/tenants/${id}`)
}

// ─── Health ─────────────────────────────────────────────────────────────────

export async function checkHealth() {
  return apiGet<HealthStatus>('/health')
}

export async function checkReadiness() {
  return apiGet<HealthStatus>('/health/ready')
}

// ─── Education Portal (Vue parity) ───────────────────────────────────────────

export async function getParentChildren() {
  return apiGet<Student[]>('/education/parent/children')
}

export async function getStudentSchedule(studentId: string) {
  return apiGet<unknown>(`/education/students/${encodeURIComponent(studentId)}/schedule`)
}

export async function getStudentAttendanceCalendar(studentId: string, studentGroup: string) {
  return apiGet<unknown>(`/education/students/${encodeURIComponent(studentId)}/attendance`, {
    params: { studentGroup },
  })
}

export async function getStudentInvoices(studentId: string) {
  return apiGet<unknown[]>(`/education/students/${encodeURIComponent(studentId)}/invoices`)
}

export async function getStudentPrograms(studentId: string) {
  return apiGet<unknown>(`/education/students/${encodeURIComponent(studentId)}/programs`)
}

export async function getStudentGrades(studentId: string, program: string) {
  return apiGet<unknown[]>(`/education/students/${encodeURIComponent(studentId)}/grades`, {
    params: { program },
  })
}

export async function applyLeave(studentId: string, data: {
  from_date: string
  to_date: string
  reason: string
  student_group: string
}) {
  return apiPost(`/education/students/${encodeURIComponent(studentId)}/leave`, data)
}

export async function listLeaveRequests() {
  return apiGet<import('./types').LeaveRequest[]>('/education/leave-requests')
}

export async function updateLeaveRequest(id: string, status: 'Approved' | 'Rejected') {
  return apiPut(`/education/leave-requests/${encodeURIComponent(id)}`, { status })
}

export async function listInstructors() {
  return apiGet<import('./types').Instructor[]>('/education/instructors')
}

export async function createInstructor(data: {
  instructor_name: string
  cell_number?: string
  email_address?: string
}) {
  return apiPost('/education/instructors', data)
}

export async function deactivateInstructor(id: string) {
  return apiPut(`/education/instructors/${encodeURIComponent(id)}`, {})
}

export async function createAssessmentResult(data: {
  student: string
  assessment_plan: string
  program: string
  course: string
  total_score: number
  maximum_score: number
}) {
  return apiPost('/education/assessment-results', data)
}

// ─── Live Class (BBB) ───────────────────────────────────────────────────────

export async function createLiveClass(batchId: string, name: string) {
  return apiPost<{ meetingId: string }>(`/live-class/${encodeURIComponent(batchId)}/create`, { name })
}

export async function joinLiveClass(meetingId: string, fullName?: string) {
  return apiPost<{ joinUrl: string; name?: string }>(`/live-class/${encodeURIComponent(meetingId)}/join`, { fullName })
}

export async function listLiveClasses(batchId?: string) {
  return apiGet<{ meetingId: string; batchId: string; name: string; createdAt: string }[]>(
    '/live-class',
    { params: batchId ? { batchId } : undefined },
  )
}

export async function endLiveClass(meetingId: string) {
  return apiDelete(`/live-class/${encodeURIComponent(meetingId)}`)
}

export async function getMeetingRecordings(meetingId: string) {
  return apiGet<{ recordings?: { recording?: import('./types').Recording | import('./types').Recording[] } }>(
    `/live-class/${encodeURIComponent(meetingId)}/recordings`,
  )
}

// ─── Fees / Razorpay ────────────────────────────────────────────────────────

export async function getPaymentHistory(studentId?: string) {
  return apiGet<import('./types').PaymentTransaction[]>('/fees/history', { params: { studentId } })
}

export async function recordManualPayment(data: {
  studentId: string
  amount: number
  payment_mode: 'Cash' | 'UPI' | 'Cheque'
  reference_no?: string
  date: string
}) {
  return apiPost('/fees/payment', data)
}

export async function sendBulkReminders(studentIds: string[]) {
  return apiPost('/fees/reminder/bulk', { studentIds })
}

export async function getRazorpayConfig() {
  return apiGet<{ keyId: string; currency: string }>('/fees/razorpay/config')
}

export async function saveRazorpayConfig(data: { keyId: string; keySecret: string }) {
  return apiPost('/fees/razorpay/config', data)
}

export async function createRazorpayOrder(data: { studentId: string; amount: number; feeId?: string }) {
  return apiPost<{ orderId: string; amount: number; currency: string; keyId: string }>(
    '/fees/razorpay/order',
    data,
  )
}

export async function verifyRazorpayPayment(data: {
  studentId: string
  amount: number
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}) {
  return apiPost('/fees/razorpay/verify', data)
}

// ─── Feature flags ──────────────────────────────────────────────────────────

export async function getFeatureCatalog() {
  return apiGet<{ key: string; label: string; description: string; category: string }[]>(
    '/superadmin/features/catalog',
  )
}

export async function getTenantFeatures(tenantId: string) {
  return apiGet<{ resolved: Record<string, boolean>; overrides?: Record<string, boolean> }>(
    `/superadmin/tenants/${tenantId}/features`,
  )
}

export async function updateTenantFeatures(tenantId: string, features: Record<string, boolean>) {
  return apiPut<{ resolved: Record<string, boolean> }>(
    `/superadmin/tenants/${tenantId}/features`,
    { features },
  )
}

// ─── Tests (Moodle) ─────────────────────────────────────────────────────────

export async function listTests(courseIds: number[]) {
  return apiGet<import('./types').MoodleQuiz[]>('/tests', { params: { courseIds: courseIds.join(',') } })
}

export async function startTestAttempt(quizId: number, userId?: number) {
  return apiPost<{ attempt: { id: number } }>(`/tests/${quizId}/attempt/start`, { userId })
}

export async function getAttemptData(attemptId: number, page?: number) {
  return apiGet<import('./types').QuizAttemptData>(`/tests/attempt/${attemptId}/data`, {
    params: page !== undefined ? { page } : undefined,
  })
}

export async function getAttemptReview(attemptId: number, page?: number) {
  return apiGet<import('./types').QuizReview>(`/tests/attempt/${attemptId}/review`, {
    params: page !== undefined ? { page } : undefined,
  })
}

export async function submitTestAttempt(attemptId: number, answers: Record<string, string>) {
  return apiPost(`/tests/attempt/${attemptId}/submit`, { answers })
}

export async function createQuiz(data: { courseId: number; name: string; intro?: string }) {
  return apiPost<{ id?: number }>('/tests/quizzes', data)
}

// ─── LMS (Moodle) ───────────────────────────────────────────────────────────

export async function listLmsCourses() {
  return apiGet<unknown[]>('/lms/courses')
}

export async function createLmsCourse(data: { fullname: string; shortname: string; categoryid?: number }) {
  return apiPost<{ id?: number }>('/lms/courses', data)
}

export async function getLmsCourseContent(courseId: number) {
  return apiGet<unknown>(`/lms/courses/${courseId}/content`)
}

export async function addLmsCourseContent(
  courseId: number,
  data: { name: string; externalurl?: string; filename?: string; filecontentBase64?: string },
) {
  return apiPost(`/lms/courses/${courseId}/content`, data)
}

export async function getLmsCourseGrades(courseId: number, userId: number) {
  return apiGet<unknown>(`/lms/courses/${courseId}/grades`, { params: { userId } })
}

// ─── Advanced Moodle Activities ─────────────────────────────────────────────

export async function submitMoodleAssignment(assignmentId: number, fileBase64: string, filename: string) {
  return apiPost(`/lms/assignments/${assignmentId}/submit`, { fileBase64, filename })
}

export async function addMoodleForumDiscussion(forumId: number, subject: string, message: string) {
  return apiPost(`/lms/forums/${forumId}/discussions`, { subject, message })
}

export async function replyMoodleDiscussion(discussionId: number, message: string) {
  return apiPost(`/lms/discussions/${discussionId}/replies`, { message })
}

export async function getMoodleGradeItems(courseId: number) {
  return apiGet<import('./types').GradeItem[]>(`/lms/courses/${courseId}/grade-items`)
}

export async function saveMoodleGrades(courseId: number, grades: { userid: number; grade: number; itemid: number }[]) {
  return apiPost(`/lms/courses/${courseId}/grades`, { grades })
}

export async function createMoodleActivity(courseId: number, data: { type: string; name: string; intro?: string; [key: string]: any }) {
  return apiPost<{ id: number; url: string }>(`/lms/courses/${courseId}/activities`, data)
}

// ─── Super Admin ────────────────────────────────────────────────────────────

export async function getPlatformStats() {
  return apiGet<Record<string, unknown>>('/superadmin/stats')
}

export async function getAuditLogs(params?: {
  instituteId?: string
  userId?: string
  action?: string
  limit?: number
  offset?: number
}) {
  return apiGet<{ total: number; items: unknown[] }>('/superadmin/audit-logs', { params })
}

export async function getTenantMetrics(tenantId: string) {
  return apiGet<Record<string, unknown>>(`/superadmin/tenants/${tenantId}/metrics`)
}

export async function suspendTenant(tenantId: string) {
  return apiPost(`/superadmin/tenants/${tenantId}/suspend`, {})
}

// ─── Proxy (admin ERP/Moodle passthrough) ───────────────────────────────────

export async function proxyErpList(doctype: string, filters?: string, fields?: string) {
  return apiGet<unknown[]>(`/proxy/erp/${encodeURIComponent(doctype)}`, { params: { filters, fields } })
}

export async function proxyErpGet(doctype: string, name: string) {
  return apiGet<unknown>(`/proxy/erp/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`)
}

export async function proxyErpCreate(doctype: string, data: Record<string, unknown>) {
  return apiPost<unknown>(`/proxy/erp/${encodeURIComponent(doctype)}`, data)
}

export async function proxyErpUpdate(doctype: string, name: string, data: Record<string, unknown>) {
  return apiPut<unknown>(`/proxy/erp/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, data)
}

export async function proxyErpMethod(method: string, data?: Record<string, unknown>) {
  return apiPost<unknown>('/proxy/erp/method', { method, data })
}

export async function proxyMoodleCall(wsFunction: string, params?: Record<string, unknown>) {
  return apiPost<unknown>('/proxy/moodle/call', { wsFunction, params })
}

export async function getAuthFeatures() {
  return apiGet<Record<string, boolean>>('/auth/features')
}

// ─── Notifications ──────────────────────────────────────────────────────────

export async function getNotificationLogs(params?: { tenant?: string; event?: string }) {
  return apiGet<import('./types').NotificationLog[]>('/notifications/logs', { params })
}

export async function getNotificationPreferences() {
  return apiGet<import('./types').NotificationPreferences>('/notifications/preferences')
}

export async function updateNotificationPreferences(data: Partial<import('./types').NotificationPreferences>) {
  return apiPut<import('./types').NotificationPreferences>('/notifications/preferences', data)
}
