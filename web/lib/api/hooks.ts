'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './services'
import { queryKeys } from './query-keys'

// ─── Students ───────────────────────────────────────────────────────────────

export function useStudents() {
  return useQuery({
    queryKey: queryKeys.students.all,
    queryFn: api.listStudents,
  })
}

export function useStudent(erpId: string) {
  return useQuery({
    queryKey: queryKeys.students.detail(erpId),
    queryFn: () => api.getStudent(erpId),
    enabled: !!erpId,
  })
}

export function useStudentTimeline(erpId: string) {
  return useQuery({
    queryKey: queryKeys.students.timeline(erpId),
    queryFn: () => api.getStudentTimeline(erpId),
    enabled: !!erpId,
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createStudent,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.students.all }),
  })
}

export function useUpdateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ erpId, data }: { erpId: string; data: Parameters<typeof api.updateStudent>[1] }) =>
      api.updateStudent(erpId, data),
    onSuccess: (_, { erpId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all })
      qc.invalidateQueries({ queryKey: queryKeys.students.detail(erpId) })
    },
  })
}

export function useBulkImportStudents() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.bulkImportStudents,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.students.all }),
  })
}

// ─── Batches ────────────────────────────────────────────────────────────────

export function useBatches() {
  return useQuery({
    queryKey: queryKeys.batches.all,
    queryFn: api.listBatches,
  })
}

export function useBatch(id: string) {
  return useQuery({
    queryKey: queryKeys.batches.detail(id),
    queryFn: () => api.getBatch(id),
    enabled: !!id,
  })
}

export function useCreateBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createBatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.batches.all }),
  })
}

export function useEnrollStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ batchId, studentId }: { batchId: string; studentId: string }) =>
      api.enrollStudent(batchId, studentId),
    onSuccess: (_, { batchId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.batches.all })
      qc.invalidateQueries({ queryKey: queryKeys.batches.detail(batchId) })
    },
  })
}

export function useScheduleBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      batchId,
      data,
    }: {
      batchId: string
      data: Parameters<typeof api.scheduleBatch>[1]
    }) => api.scheduleBatch(batchId, data),
    onSuccess: (_, { batchId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.batches.detail(batchId) })
    },
  })
}

// ─── Attendance ─────────────────────────────────────────────────────────────

export function useAttendanceReports(batchId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.attendance.reports(batchId, startDate, endDate),
    queryFn: () => api.getAttendanceReports(batchId, startDate, endDate),
    enabled: !!batchId && !!startDate && !!endDate,
  })
}

export function useMarkAttendance() {
  return useMutation({
    mutationFn: api.markManualAttendance,
  })
}

// ─── Fees ───────────────────────────────────────────────────────────────────

export function usePendingFees(studentId: string) {
  return useQuery({
    queryKey: queryKeys.fees.pending(studentId),
    queryFn: () => api.getPendingFees(studentId),
    enabled: !!studentId,
  })
}

export function useRecordPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.recordPayment,
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.fees.pending(studentId) })
    },
  })
}

export function usePaymentHistory(studentId?: string) {
  return useQuery({
    queryKey: ['fees', 'history', studentId],
    queryFn: () => api.getPaymentHistory(studentId),
  })
}

export function useRecordManualPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.recordManualPayment,
    onSuccess: (_, { studentId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.fees.pending(studentId) })
      qc.invalidateQueries({ queryKey: ['fees', 'history'] })
    },
  })
}

export function useSendBulkReminders() {
  return useMutation({
    mutationFn: api.sendBulkReminders,
  })
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export function useKpis(tenantId?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.kpis(tenantId),
    queryFn: () => api.getKpis(tenantId),
  })
}

export function useDashboardEmbed(id: number, tenantId?: string) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(id, tenantId),
    queryFn: () => api.getDashboardEmbed(id, tenantId),
    enabled: id > 0,
  })
}

// ─── Tenants ────────────────────────────────────────────────────────────────

export function useTenants() {
  return useQuery({
    queryKey: queryKeys.tenants.all,
    queryFn: api.listTenants,
  })
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(id),
    queryFn: () => api.getTenant(id),
    enabled: !!id,
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createTenant,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tenants.all }),
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.updateTenant(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.tenants.all })
      qc.invalidateQueries({ queryKey: queryKeys.tenants.detail(id) })
    },
  })
}

// ─── Health ───────────────────────────────────────────────────────────────────

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health.liveness,
    queryFn: api.checkHealth,
    refetchInterval: 30_000,
  })
}

export function useReadiness() {
  return useQuery({
    queryKey: queryKeys.health.readiness,
    queryFn: api.checkReadiness,
    refetchInterval: 30_000,
  })
}

export function useParentChildren() {
  return useQuery({
    queryKey: queryKeys.education.children,
    queryFn: api.getParentChildren,
  })
}

export function useStudentSchedule(studentId: string) {
  return useQuery({
    queryKey: queryKeys.education.schedule(studentId),
    queryFn: () => api.getStudentSchedule(studentId),
    enabled: !!studentId,
  })
}

export function useStudentPrograms(studentId: string) {
  return useQuery({
    queryKey: queryKeys.education.programs(studentId),
    queryFn: () => api.getStudentPrograms(studentId),
    enabled: !!studentId,
  })
}

export function useStudentGrades(studentId: string, program: string) {
  return useQuery({
    queryKey: queryKeys.education.grades(studentId, program),
    queryFn: () => api.getStudentGrades(studentId, program),
    enabled: !!studentId && !!program,
  })
}

export function useStudentInvoices(studentId: string) {
  return useQuery({
    queryKey: queryKeys.education.invoices(studentId),
    queryFn: () => api.getStudentInvoices(studentId),
    enabled: !!studentId,
  })
}

export function useTests(courseIds: number[]) {
  return useQuery({
    queryKey: queryKeys.tests(courseIds),
    queryFn: () => api.listTests(courseIds),
    enabled: courseIds.length > 0,
  })
}

export function useStartAttempt() {
  return useMutation({
    mutationFn: ({ quizId, userId }: { quizId: number; userId?: number }) =>
      api.startTestAttempt(quizId, userId),
  })
}

export function useAttemptData(attemptId: number) {
  return useQuery({
    queryKey: queryKeys.testsAttempt(attemptId),
    queryFn: () => api.getAttemptData(attemptId),
    enabled: attemptId > 0,
  })
}

export function useAttemptReview(attemptId: number) {
  return useQuery({
    queryKey: queryKeys.testsReview(attemptId),
    queryFn: () => api.getAttemptReview(attemptId),
    enabled: attemptId > 0,
  })
}

export function useSubmitAttempt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ attemptId, answers }: { attemptId: number; answers: Record<string, string> }) =>
      api.submitTestAttempt(attemptId, answers),
    onSuccess: (_, { attemptId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.testsReview(attemptId) })
    },
  })
}

export function useMeetingRecordings(meetingId: string) {
  return useQuery({
    queryKey: queryKeys.recordings(meetingId),
    queryFn: () => api.getMeetingRecordings(meetingId),
    enabled: !!meetingId,
  })
}

export function useLmsCourses() {
  return useQuery({
    queryKey: queryKeys.lms.courses,
    queryFn: api.listLmsCourses,
  })
}

export function usePlatformStats() {
  return useQuery({
    queryKey: queryKeys.superadmin.stats,
    queryFn: api.getPlatformStats,
    refetchInterval: 30_000,
  })
}

export function useAuditLogs(filters?: Parameters<typeof api.getAuditLogs>[0]) {
  return useQuery({
    queryKey: queryKeys.superadmin.auditLogs(JSON.stringify(filters)),
    queryFn: () => api.getAuditLogs(filters),
    refetchInterval: 15_000,
  })
}

export function useTenantMetrics(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.superadmin.tenantMetrics(tenantId),
    queryFn: () => api.getTenantMetrics(tenantId),
    enabled: !!tenantId,
  })
}

export function useCreateLiveClass() {
  return useMutation({
    mutationFn: ({ batchId, name }: { batchId: string; name: string }) =>
      api.createLiveClass(batchId, name),
  })
}

export function useJoinLiveClass() {
  return useMutation({
    mutationFn: ({ meetingId, fullName }: { meetingId: string; fullName?: string }) =>
      api.joinLiveClass(meetingId, fullName),
  })
}

export function useLiveClasses(batchId?: string) {
  return useQuery({
    queryKey: ['live-class', batchId ?? 'all'],
    queryFn: () => api.listLiveClasses(batchId),
  })
}

export function useEndLiveClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.endLiveClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-class'] }),
  })
}

export function useFeatureCatalog() {
  return useQuery({
    queryKey: ['features', 'catalog'],
    queryFn: api.getFeatureCatalog,
  })
}

export function useTenantFeatures(tenantId: string) {
  return useQuery({
    queryKey: ['features', 'tenant', tenantId],
    queryFn: () => api.getTenantFeatures(tenantId),
    enabled: !!tenantId,
  })
}

export function useUpdateTenantFeatures() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ tenantId, features }: { tenantId: string; features: Record<string, boolean> }) =>
      api.updateTenantFeatures(tenantId, features),
    onSuccess: (_, { tenantId }) => {
      qc.invalidateQueries({ queryKey: ['features', 'tenant', tenantId] })
      qc.invalidateQueries({ queryKey: queryKeys.tenants.detail(tenantId) })
    },
  })
}

export function useSaveRazorpayConfig() {
  return useMutation({
    mutationFn: api.saveRazorpayConfig,
  })
}

export function useApplyLeave() {
  return useMutation({
    mutationFn: ({
      studentId,
      data,
    }: {
      studentId: string
      data: Parameters<typeof api.applyLeave>[1]
    }) => api.applyLeave(studentId, data),
  })
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: queryKeys.education.leaveRequests,
    queryFn: api.listLeaveRequests,
  })
}

export function useUpdateLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Approved' | 'Rejected' }) =>
      api.updateLeaveRequest(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.education.leaveRequests }),
  })
}

export function useInstructors() {
  return useQuery({
    queryKey: queryKeys.education.instructors,
    queryFn: api.listInstructors,
  })
}

export function useCreateAssessmentResult() {
  return useMutation({
    mutationFn: api.createAssessmentResult,
  })
}

export function useCreateLmsCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createLmsCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lms.courses }),
  })
}

export function useAddLmsCourseContent(courseId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof api.addLmsCourseContent>[1]) =>
      api.addLmsCourseContent(courseId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.lms.content(courseId) }),
  })
}

// ─── Advanced Moodle Activities ─────────────────────────────────────────────

export function useSubmitMoodleAssignment() {
  return useMutation({
    mutationFn: ({ assignmentId, fileBase64, filename }: { assignmentId: number; fileBase64: string; filename: string }) =>
      api.submitMoodleAssignment(assignmentId, fileBase64, filename),
  })
}

export function useAddMoodleForumDiscussion() {
  return useMutation({
    mutationFn: ({ forumId, subject, message }: { forumId: number; subject: string; message: string }) =>
      api.addMoodleForumDiscussion(forumId, subject, message),
  })
}

export function useReplyMoodleDiscussion() {
  return useMutation({
    mutationFn: ({ discussionId, message }: { discussionId: number; message: string }) =>
      api.replyMoodleDiscussion(discussionId, message),
  })
}

export function useMoodleGradeItems(courseId: number) {
  return useQuery({
    queryKey: ['moodle-grade-items', courseId],
    queryFn: () => api.getMoodleGradeItems(courseId),
    enabled: !!courseId,
  })
}

export function useSaveMoodleGrades() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, grades }: { courseId: number; grades: { userid: number; grade: number; itemid: number }[] }) =>
      api.saveMoodleGrades(courseId, grades),
    onSuccess: (_, { courseId }) => {
      qc.invalidateQueries({ queryKey: ['moodle-grade-items', courseId] })
    },
  })
}

export function useCreateMoodleActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: number; data: { type: string; name: string; intro?: string; [key: string]: any } }) =>
      api.createMoodleActivity(courseId, data),
    onSuccess: (_, { courseId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.lms.content(courseId) })
    },
  })
}

export function useCreateQuiz() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createQuiz,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  })
}

export function useBatchStudents(batchId: string) {
  return useQuery({
    queryKey: queryKeys.batches.students(batchId),
    queryFn: () => api.getBatchStudents(batchId),
    enabled: !!batchId,
  })
}

export function useCreateInstructor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createInstructor,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.education.instructors }),
  })
}

export function useDeactivateInstructor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deactivateInstructor,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.education.instructors }),
  })
}

export function useStudentAttendanceCalendar(studentId: string, studentGroup: string) {
  return useQuery({
    queryKey: queryKeys.education.attendance(studentId, studentGroup),
    queryFn: () => api.getStudentAttendanceCalendar(studentId, studentGroup),
    enabled: !!studentId && !!studentGroup,
  })
}

export function useSuspendTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.suspendTenant,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.tenants.all })
      qc.invalidateQueries({ queryKey: queryKeys.superadmin.tenantMetrics(id) })
    },
  })
}

// ─── Frappe Proxies (Diary & Help) ──────────────────────────────────────────

export function useSchoolDiary(batchName?: string) {
  return useQuery({
    queryKey: ['frappe', 'school_diary', batchName],
    queryFn: () => {
      const filters = batchName ? JSON.stringify([['student_group', '=', batchName]]) : undefined
      const fields = JSON.stringify(['name', 'date', 'title', 'content', 'published', 'instructor_name', 'student_group'])
      return api.proxyErpList('Student Diary', filters, fields) as Promise<import('./types').SchoolDiaryEntry[]>
    }
  })
}

export function useHelpCategories() {
  return useQuery({
    queryKey: ['frappe', 'help_category'],
    queryFn: () => {
      const fields = JSON.stringify(['name', 'category_name', 'description', 'icon'])
      return api.proxyErpList('Help Category', undefined, fields) as Promise<import('./types').HelpCategory[]>
    }
  })
}

export function useHelpArticles(category?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ['frappe', 'help_article', category, searchQuery],
    queryFn: () => {
      const filters: any[] = [['published', '=', 1]]
      if (category) filters.push(['category', '=', category])
      if (searchQuery) filters.push(['title', 'like', `%${searchQuery}%`])
      
      const fields = JSON.stringify(['name', 'title', 'category', 'content', 'published', 'author'])
      return api.proxyErpList('Help Article', JSON.stringify(filters), fields) as Promise<import('./types').HelpArticle[]>
    }
  })
}

// ─── Notifications ──────────────────────────────────────────────────────────

export function useNotificationLogs(filters?: Parameters<typeof api.getNotificationLogs>[0]) {
  return useQuery({
    queryKey: ['notifications', 'logs', JSON.stringify(filters)],
    queryFn: () => api.getNotificationLogs(filters),
    refetchInterval: 15_000,
  })
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: api.getNotificationPreferences,
  })
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.updateNotificationPreferences,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] })
    },
  })
}
