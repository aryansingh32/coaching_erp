/**
 * Super Admin — "Mission Control" palette
 * Derived from: Novu's restraint principle + Metabase Orion dark scale
 * This accent (violet) is reserved for Super Admin ONLY and must never
 * be used as a tenant custom_branding default.
 */
export const platform = {
  bg: '#0B1220',        // deeper than Novu near-black, roomier than Metabase Orion-100
  surface: '#141B2E',
  elevated: '#1C2540',
  border: '#293252',
  text: '#F0F4FC',
  muted: '#8A93B2',
  accent: '#7C5CFF',    // violet — deliberately far from Novu's rose AND any plausible tenant brand color
  success: '#22C55E',   // same hue family as Novu/Moodle/ERPNext green — cross-app consistency for "success"
  warning: '#F59E0B',
  danger: '#EF4444',
} as const

export type PlatformToken = typeof platform
