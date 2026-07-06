/**
 * Institute (Admin/Teacher) — professional light palette
 * Derived from: ERPNext / Frappe UI Design System
 * The `primary` is overridden per-tenant via CSS custom properties
 * set during login from `branding.primaryColor`.
 */
export const institute = {
  bgBase: '#F6F8FA',      // Frappe-exact surface-off-white
  bgSurface: '#FFFFFF',
  bgMuted: '#F3F4F6',
  border: '#D1D5DB',      // slightly warmer than GitHub D0D7DE for ERPNext feel
  text: '#1F2328',
  muted: '#6B7280',
  // Primary: defaulted here, overridden at runtime via CSS var --inst-primary
  primary: '#4F46E5',     // indigo-600 — removed from tenant branding surface, used as fallback
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  // Semantic colors for attendance/gradebook states
  present: '#BBF7D0',     // Moodle attendance green-tint
  absent: '#FEE2E2',
  late: '#FEF3C7',
} as const

export type InstituteToken = typeof institute
