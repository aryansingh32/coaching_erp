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

export interface MoodleQuiz {
  id: number
  name: string
  course?: number
  courseid?: number
  timelimit?: number
  grade?: number
  intro?: string
}

export interface QuizQuestion {
  slot: number
  type: string
  html: string
  page: number
  number?: number
  answernumbering?: string
}

export interface QuizAttemptData {
  attempt: { id: number; quiz: number; timestart?: number; timefinish?: number; state?: string }
  questions: QuizQuestion[]
  warnings?: unknown[]
}

export interface QuizReview {
  grade?: number
  attempt?: { sumgrades?: number; state?: string }
  questions?: Array<{
    slot: number
    type: string
    html: string
    mark?: number
    maxmark?: number
    state?: string
  }>
}

export interface Recording {
  recordID: string
  meetingID: string
  name: string
  published: boolean
  playback?: { format: { type: string; url: string } | Array<{ type: string; url: string }> }
}

export interface LeaveRequest {
  name: string
  student: string
  from_date: string
  to_date: string
  reason?: string
  student_group?: string
  status?: string
}

export interface Instructor {
  name: string
  instructor_name: string
  cell_number?: string
  email_address?: string
  status?: string
}

export interface NotificationLog {
  id: string
  event: string
  tenant: string
  channel: string
  status: 'delivered' | 'failed' | 'pending'
  timestamp: string
}

export interface NotificationPreferences {
  email: boolean
  sms: boolean
  push: boolean
  quietHours: {
    enabled: boolean
    start?: string
    end?: string
  }
}

export interface PaymentTransaction {
  id: string
  student_id: string
  student_name?: string
  amount: number
  payment_mode: 'Cash' | 'UPI' | 'Cheque' | 'Online'
  status: 'Completed' | 'Pending' | 'Failed'
  reference_no?: string
  date: string
}

export interface MoodleAssignment {
  id: number
  course: number
  name: string
  intro?: string
  duedate: number
  allowsubmissionsfromdate: number
  cutoffdate: number
  gradingduedate?: number
  maxgrade?: number
}

export interface MoodleForum {
  id: number
  course: number
  type: string // 'general', 'single', 'eachuser', 'qanda'
  name: string
  intro?: string
}

export interface MoodleDiscussion {
  id: number
  name: string
  groupid: number
  timemodified: number
  usermodified: number
  timestart: number
  timeend: number
  discussion: number
  parent: number
  userid: number
  created: number
  modified: number
  mailed: number
  subject: string
  message: string
  messageformat: number
  messagetrust: number
  attachment: string
  totalscore: number
  mailnow: number
  userfullname: string
  usermodifiedfullname: string
  userpictureurl: string
  usermodifiedpictureurl: string
  numreplies: number
  numunread: number
  pinned: boolean
  locked: boolean
}

export interface MoodleSubmission {
  id: number
  userid: number
  attemptnumber: number
  timecreated: number
  timemodified: number
  status: string // 'new', 'draft', 'submitted'
  groupid: number
  assignment?: number
  latest?: number
  plugins?: Array<{
    type: string // 'file', 'onlinetext'
    name: string
    fileareas?: Array<{
      area: string
      files: Array<{
        filename: string
        filepath: string
        filesize: number
        fileurl: string
        timemodified: number
        mimetype: string
      }>
    }>
    editorfields?: Array<{
      name: string
      description: string
      text: string
      format: number
    }>
  }>
}

export interface GradeItem {
  id: number
  itemname: string
  itemtype: string
  itemmodule: string
  iteminstance: number
  itemnumber: number
  idnumber: string
  categoryid: number
  outcomeid: number
  scaleid: number
  fallbackgrades: number
  gradepass: number
  grademax: number
  grademin: number
  hidden: boolean
  locked: boolean
  grades?: Array<{
    userid: number
    grade: number
    locked: boolean
    hidden: boolean
    overridden: boolean
    feedback: string
    feedbackformat: number
    usermodified: number
    dategraded: number
    datesubmitted: number
  }>
}

export interface SchoolDiaryEntry {
  name: string
  date: string
  title: string
  content: string
  published: boolean
  instructor_name?: string
  student_group?: string
}

export interface HelpCategory {
  name: string
  category_name: string
  description?: string
  icon?: string
}

export interface HelpArticle {
  name: string
  title: string
  category: string
  content: string
  published: boolean
  author?: string
}
