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
  '/institute/batches': 'batches',
  '/institute/schedule': 'schedule',
  '/institute/attendance': 'attendance_manual',
  '/institute/grades': 'grades',
  '/institute/finance': 'fees_management',
  '/institute/exams': 'online_tests',
  '/institute/settings': undefined,
}
