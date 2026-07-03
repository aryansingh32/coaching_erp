export const queryKeys = {
  auth: ['auth'] as const,
  students: {
    all: ['students'] as const,
    detail: (erpId: string) => ['students', erpId] as const,
    timeline: (erpId: string) => ['students', erpId, 'timeline'] as const,
  },
  batches: {
    all: ['batches'] as const,
    detail: (id: string) => ['batches', id] as const,
    students: (id: string) => ['batches', id, 'students'] as const,
  },
  attendance: {
    reports: (batchId: string, start: string, end: string) =>
      ['attendance', 'reports', batchId, start, end] as const,
  },
  fees: {
    pending: (studentId: string) => ['fees', 'pending', studentId] as const,
  },
  analytics: {
    kpis: (tenantId?: string) => ['analytics', 'kpis', tenantId] as const,
    dashboard: (id: number, tenantId?: string) =>
      ['analytics', 'dashboard', id, tenantId] as const,
  },
  tenants: {
    all: ['tenants'] as const,
    detail: (id: string) => ['tenants', id] as const,
  },
  health: {
    liveness: ['health'] as const,
    readiness: ['health', 'ready'] as const,
  },
  education: {
    children: ['education', 'children'] as const,
    schedule: (id: string) => ['education', 'schedule', id] as const,
    attendance: (id: string, group: string) => ['education', 'attendance', id, group] as const,
    invoices: (id: string) => ['education', 'invoices', id] as const,
    programs: (id: string) => ['education', 'programs', id] as const,
    grades: (id: string, program: string) => ['education', 'grades', id, program] as const,
    leaveRequests: ['education', 'leave-requests'] as const,
    instructors: ['education', 'instructors'] as const,
  },
  tests: (courseIds: number[]) => ['tests', courseIds.join(',')] as const,
  testsAttempt: (attemptId: number) => ['tests', 'attempt', attemptId] as const,
  testsReview: (attemptId: number) => ['tests', 'review', attemptId] as const,
  recordings: (meetingId: string) => ['recordings', meetingId] as const,
  lms: {
    courses: ['lms', 'courses'] as const,
    content: (id: number) => ['lms', 'courses', id, 'content'] as const,
  },
  superadmin: {
    stats: ['superadmin', 'stats'] as const,
    auditLogs: (filters?: string) => ['superadmin', 'audit', filters] as const,
    tenantMetrics: (id: string) => ['superadmin', 'tenant', id] as const,
  },
}
