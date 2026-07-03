import { useAuthStore } from '@/lib/stores/auth-store'

export type FeatureFlags = Record<string, boolean>

export function useFeatures(): FeatureFlags {
  return useAuthStore((s) => s.features) ?? {}
}

export function useFeatureEnabled(featureKey: string): boolean {
  const features = useFeatures()
  return features[featureKey] === true
}

export const INSTITUTE_NAV_FEATURES: Record<string, string | undefined> = {
  '/institute/dashboard': 'analytics',
  '/institute/students': 'student_management',
  '/institute/students/import': 'bulk_import',
  '/institute/staff': 'teacher_portal',
  '/institute/batches': 'batches',
  '/institute/courses': 'moodle_lms',
  '/institute/live-classes': 'live_classes',
  '/institute/recordings': 'recordings',
  '/institute/schedule': 'schedule',
  '/institute/attendance': 'attendance_manual',
  '/institute/leave-requests': 'student_management',
  '/institute/grades': 'grades',
  '/institute/finance': 'fees_management',
  '/institute/exams': 'online_tests',
  '/institute/communication': 'communication',
  '/institute/developer': 'api_proxy',
  '/institute/settings': undefined,
}
