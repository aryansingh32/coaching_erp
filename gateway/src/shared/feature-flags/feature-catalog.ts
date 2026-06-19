export interface FeatureDefinition {
  key: string
  label: string
  description: string
  category: 'core' | 'academics' | 'finance' | 'communication' | 'analytics' | 'integrations'
  defaultPlans: string[]
}

export const FEATURE_CATALOG: FeatureDefinition[] = [
  { key: 'student_management', label: 'Student Management', description: 'CRUD students, profiles, timeline', category: 'core', defaultPlans: ['starter', 'growth', 'professional'] },
  { key: 'batches', label: 'Batches & Programs', description: 'Student groups, enrollment, scheduling', category: 'core', defaultPlans: ['starter', 'growth', 'professional'] },
  { key: 'attendance_manual', label: 'Manual Attendance', description: 'Teacher mark attendance', category: 'academics', defaultPlans: ['starter', 'growth', 'professional'] },
  { key: 'attendance_rfid', label: 'RFID Attendance', description: 'Real-time RFID punches and live feed', category: 'academics', defaultPlans: ['growth', 'professional'] },
  { key: 'schedule', label: 'Class Schedule', description: 'Course schedule calendar', category: 'academics', defaultPlans: ['starter', 'growth', 'professional'] },
  { key: 'grades', label: 'Grades & Assessments', description: 'ERPNext assessment results', category: 'academics', defaultPlans: ['growth', 'professional'] },
  { key: 'fees_management', label: 'Fee Management', description: 'Fee schedules, invoices, defaulters', category: 'finance', defaultPlans: ['starter', 'growth', 'professional'] },
  { key: 'online_payments', label: 'Online Payments (Razorpay)', description: 'Students pay fees online', category: 'finance', defaultPlans: ['growth', 'professional'] },
  { key: 'live_classes', label: 'Live Online Classes (BBB)', description: 'BigBlueButton virtual classrooms', category: 'academics', defaultPlans: ['growth', 'professional'] },
  { key: 'moodle_lms', label: 'Moodle LMS', description: 'Courses, content, completion tracking', category: 'academics', defaultPlans: ['growth', 'professional'] },
  { key: 'online_tests', label: 'Online Tests (Moodle Quiz)', description: 'Moodle quiz attempts and grading', category: 'academics', defaultPlans: ['growth', 'professional'] },
  { key: 'analytics', label: 'Analytics Dashboard', description: 'Metabase embedded BI', category: 'analytics', defaultPlans: ['growth', 'professional'] },
  { key: 'notifications', label: 'Push & SMS Notifications', description: 'Novu multi-channel notifications', category: 'communication', defaultPlans: ['growth', 'professional'] },
  { key: 'parent_portal', label: 'Parent Portal', description: 'Guardian-linked student views', category: 'core', defaultPlans: ['starter', 'growth', 'professional'] },
  { key: 'teacher_portal', label: 'Teacher Portal', description: 'Instructor web and mobile access', category: 'core', defaultPlans: ['starter', 'growth', 'professional'] },
  { key: 'bulk_import', label: 'Bulk CSV Import', description: 'Import students via CSV', category: 'core', defaultPlans: ['growth', 'professional'] },
  { key: 'custom_branding', label: 'White-Label Branding', description: 'Custom colors and logo', category: 'core', defaultPlans: ['professional'] },
  { key: 'communication', label: 'Communication Hub', description: 'Announcements and messaging', category: 'communication', defaultPlans: ['growth', 'professional'] },
  { key: 'api_proxy', label: 'Advanced API Access', description: 'ERPNext/Moodle proxy for power users', category: 'integrations', defaultPlans: ['professional'] },
  { key: 'recordings', label: 'Class Recordings', description: 'BBB recording playback', category: 'academics', defaultPlans: ['professional'] },
]

export const PLAN_FEATURES: Record<string, string[]> = {
  starter: FEATURE_CATALOG.filter((f) => f.defaultPlans.includes('starter')).map((f) => f.key),
  growth: FEATURE_CATALOG.filter((f) => f.defaultPlans.includes('growth')).map((f) => f.key),
  professional: FEATURE_CATALOG.map((f) => f.key),
  suspended: [],
}
