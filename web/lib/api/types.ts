/** Gateway API response envelope from TransformInterceptor */
export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export type UserRole = 'student' | 'instructor' | 'parent' | 'admin' | 'super-admin' | 'super_admin'

export interface Branding {
  primaryColor: string
  logoUrl?: string
  instituteName?: string
}

export interface AuthUser {
  name: string
  first_name?: string
  last_name?: string
  student_email_id?: string
  student_mobile_number?: string
  [key: string]: unknown
}

export interface VerifyOtpResult {
  accessToken: string
  refreshToken: string
  user: AuthUser
  role?: string
  tenantId?: string
  linkedStudents?: string[]
  branding?: Branding
  features?: Record<string, boolean>
}

export interface Student {
  name: string
  first_name: string
  last_name?: string
  student_email_id?: string
  student_mobile_number?: string
  enabled?: number
  custom_rank?: number
  attendance_percentage?: number
}

export interface Batch {
  name?: string
  id?: string
  student_group_name?: string
  program?: string
  academic_term?: string
  academic_year?: string
}

export interface Tenant {
  id: string
  name: string
  status?: string
  subdomain?: string
  branding?: Branding
  [key: string]: unknown
}

export interface Kpis {
  totalStudents: number
  activeBatches: number
  revenueMonthly: number
  attendanceToday?: number
}

export interface PendingFee {
  fee_id: string
  amount: number
  due_date: string
  description?: string
}

export interface TimelineEvent {
  date: string | Date
  event: string
  type?: string
  description?: string
}

export interface AttendanceReport {
  date: string
  present: number
  absent: number
  late?: number
}

export interface AttendanceEvent {
  studentId: string
  batchId: string
  status: 'Present' | 'Absent' | 'Late'
  timestamp: string
  rfidCard?: string
  method: 'rfid' | 'manual'
}

export interface HealthStatus {
  status: string
  timestamp?: string
  details?: Record<string, string>
}

export interface DashboardEmbed {
  url: string
}
