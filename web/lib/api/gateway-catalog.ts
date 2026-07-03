/**
 * Single source of truth: every Gateway BFF route the Next.js frontend may call.
 * All traffic goes through apiClient → NEXT_PUBLIC_API_URL (default /api/v1).
 * ERPNext/Moodle/Novu/BBB/Metabase are never called directly from the browser.
 */

export type GatewayModule =
  | 'auth'
  | 'students'
  | 'batches'
  | 'attendance'
  | 'fees'
  | 'education'
  | 'lms'
  | 'live-class'
  | 'tests'
  | 'analytics'
  | 'tenants'
  | 'superadmin'
  | 'health'
  | 'proxy'

export interface GatewayEndpoint {
  module: GatewayModule
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  roles?: string[]
  feature?: string
}

export const GATEWAY_ENDPOINTS: GatewayEndpoint[] = [
  // auth
  { module: 'auth', method: 'POST', path: '/auth/send-otp', description: 'Send OTP' },
  { module: 'auth', method: 'POST', path: '/auth/verify-otp', description: 'Verify OTP & login' },
  { module: 'auth', method: 'POST', path: '/auth/refresh', description: 'Refresh JWT' },
  { module: 'auth', method: 'POST', path: '/auth/logout', description: 'Logout' },
  { module: 'auth', method: 'GET', path: '/auth/features', description: 'Resolved tenant feature flags' },
  // students
  { module: 'students', method: 'GET', path: '/students', description: 'List students', roles: ['admin'] },
  { module: 'students', method: 'POST', path: '/students', description: 'Create student', roles: ['admin'] },
  { module: 'students', method: 'GET', path: '/students/:erpId', description: 'Get student' },
  { module: 'students', method: 'PUT', path: '/students/:erpId', description: 'Update student', roles: ['admin'] },
  { module: 'students', method: 'POST', path: '/students/bulk-import', description: 'Bulk CSV import', roles: ['admin'], feature: 'bulk_import' },
  { module: 'students', method: 'POST', path: '/students/:erpId/rfid-card', description: 'Assign RFID', roles: ['admin'] },
  { module: 'students', method: 'GET', path: '/students/:erpId/timeline', description: 'Student timeline' },
  // batches
  { module: 'batches', method: 'GET', path: '/batches', description: 'List batches' },
  { module: 'batches', method: 'POST', path: '/batches', description: 'Create batch', roles: ['admin'] },
  { module: 'batches', method: 'GET', path: '/batches/:id', description: 'Get batch' },
  { module: 'batches', method: 'GET', path: '/batches/:id/students', description: 'Batch roster' },
  { module: 'batches', method: 'POST', path: '/batches/:id/enroll', description: 'Enroll student', roles: ['admin'] },
  { module: 'batches', method: 'POST', path: '/batches/:id/schedule', description: 'Schedule batch' },
  { module: 'batches', method: 'POST', path: '/batches/:id/instructors', description: 'Assign instructor', roles: ['admin'] },
  // attendance
  { module: 'attendance', method: 'POST', path: '/attendance/manual', description: 'Mark attendance', feature: 'attendance_manual' },
  { module: 'attendance', method: 'GET', path: '/attendance/reports', description: 'Attendance reports' },
  { module: 'attendance', method: 'POST', path: '/attendance/rfid-punch', description: 'RFID webhook', feature: 'attendance_rfid' },
  // fees
  { module: 'fees', method: 'GET', path: '/fees/pending/:studentId', description: 'Pending fees', feature: 'fees_management' },
  { module: 'fees', method: 'POST', path: '/fees/payment', description: 'Record payment' },
  { module: 'fees', method: 'POST', path: '/fees/schedule', description: 'Generate fee schedule' },
  { module: 'fees', method: 'GET', path: '/fees/razorpay/config', description: 'Razorpay config', feature: 'online_payments' },
  { module: 'fees', method: 'POST', path: '/fees/razorpay/order', description: 'Create Razorpay order', feature: 'online_payments' },
  { module: 'fees', method: 'POST', path: '/fees/razorpay/verify', description: 'Verify payment', feature: 'online_payments' },
  // education portal
  { module: 'education', method: 'GET', path: '/education/parent/children', description: 'Parent children', feature: 'parent_portal' },
  { module: 'education', method: 'GET', path: '/education/students/:id/schedule', description: 'Student schedule', feature: 'schedule' },
  { module: 'education', method: 'GET', path: '/education/students/:id/attendance', description: 'Student attendance' },
  { module: 'education', method: 'GET', path: '/education/students/:id/invoices', description: 'Student invoices' },
  { module: 'education', method: 'GET', path: '/education/students/:id/programs', description: 'Student programs' },
  { module: 'education', method: 'GET', path: '/education/students/:id/grades', description: 'Student grades', feature: 'grades' },
  { module: 'education', method: 'POST', path: '/education/students/:id/leave', description: 'Apply leave' },
  { module: 'education', method: 'GET', path: '/education/leave-requests', description: 'Leave inbox', roles: ['admin'] },
  { module: 'education', method: 'PUT', path: '/education/leave-requests/:id', description: 'Approve/reject leave', roles: ['admin'] },
  { module: 'education', method: 'GET', path: '/education/instructors', description: 'List instructors', roles: ['admin'] },
  { module: 'education', method: 'POST', path: '/education/instructors', description: 'Create instructor', roles: ['admin'] },
  { module: 'education', method: 'PUT', path: '/education/instructors/:id', description: 'Deactivate instructor', roles: ['admin'] },
  { module: 'education', method: 'POST', path: '/education/assessment-results', description: 'Grade entry', feature: 'grades' },
  // lms
  { module: 'lms', method: 'GET', path: '/lms/courses', description: 'List Moodle courses', feature: 'moodle_lms' },
  { module: 'lms', method: 'POST', path: '/lms/courses', description: 'Create Moodle course', feature: 'moodle_lms' },
  { module: 'lms', method: 'GET', path: '/lms/courses/:id/content', description: 'Course content', feature: 'moodle_lms' },
  { module: 'lms', method: 'POST', path: '/lms/courses/:id/content', description: 'Add course content', feature: 'moodle_lms' },
  { module: 'lms', method: 'GET', path: '/lms/courses/:id/grades', description: 'Moodle grades', feature: 'grades' },
  // live-class
  { module: 'live-class', method: 'GET', path: '/live-class', description: 'List meetings', feature: 'live_classes' },
  { module: 'live-class', method: 'POST', path: '/live-class/:batchId/create', description: 'Create BBB meeting', feature: 'live_classes' },
  { module: 'live-class', method: 'POST', path: '/live-class/:meetingId/join', description: 'Join BBB', feature: 'live_classes' },
  { module: 'live-class', method: 'DELETE', path: '/live-class/:meetingId', description: 'End meeting', feature: 'live_classes' },
  { module: 'live-class', method: 'GET', path: '/live-class/:meetingId/recordings', description: 'BBB recordings', feature: 'recordings' },
  // tests
  { module: 'tests', method: 'GET', path: '/tests', description: 'List quizzes', feature: 'online_tests' },
  { module: 'tests', method: 'POST', path: '/tests/quizzes', description: 'Create quiz', feature: 'online_tests' },
  { module: 'tests', method: 'POST', path: '/tests/:quizId/attempt/start', description: 'Start attempt', feature: 'online_tests' },
  { module: 'tests', method: 'GET', path: '/tests/attempt/:id/data', description: 'Attempt questions', feature: 'online_tests' },
  { module: 'tests', method: 'POST', path: '/tests/attempt/:id/submit', description: 'Submit attempt', feature: 'online_tests' },
  { module: 'tests', method: 'GET', path: '/tests/attempt/:id/review', description: 'Review attempt', feature: 'online_tests' },
  // analytics
  { module: 'analytics', method: 'GET', path: '/analytics/kpis', description: 'KPIs', feature: 'analytics' },
  { module: 'analytics', method: 'GET', path: '/analytics/dashboard/:id', description: 'Metabase embed', feature: 'analytics' },
  // proxy (1000+ underlying ERP/Moodle APIs)
  { module: 'proxy', method: 'GET', path: '/proxy/erp/:doctype', description: 'ERPNext list', feature: 'api_proxy' },
  { module: 'proxy', method: 'GET', path: '/proxy/erp/:doctype/:name', description: 'ERPNext get', feature: 'api_proxy' },
  { module: 'proxy', method: 'POST', path: '/proxy/erp/:doctype', description: 'ERPNext create', feature: 'api_proxy' },
  { module: 'proxy', method: 'PUT', path: '/proxy/erp/:doctype/:name', description: 'ERPNext update', feature: 'api_proxy' },
  { module: 'proxy', method: 'POST', path: '/proxy/erp/method', description: 'ERPNext method', feature: 'api_proxy' },
  { module: 'proxy', method: 'POST', path: '/proxy/moodle/call', description: 'Moodle webservice', feature: 'api_proxy' },
  // superadmin
  { module: 'superadmin', method: 'GET', path: '/superadmin/stats', description: 'Platform stats' },
  { module: 'superadmin', method: 'GET', path: '/superadmin/audit-logs', description: 'Audit logs' },
  { module: 'superadmin', method: 'GET', path: '/superadmin/features/catalog', description: 'Feature catalog' },
  { module: 'superadmin', method: 'GET', path: '/superadmin/tenants/:id/features', description: 'Tenant features' },
  { module: 'superadmin', method: 'PUT', path: '/superadmin/tenants/:id/features', description: 'Set tenant features' },
  // health
  { module: 'health', method: 'GET', path: '/health', description: 'Liveness' },
  { module: 'health', method: 'GET', path: '/health/ready', description: 'Readiness' },
]

export function getEndpointsByModule(module: GatewayModule) {
  return GATEWAY_ENDPOINTS.filter((e) => e.module === module)
}
