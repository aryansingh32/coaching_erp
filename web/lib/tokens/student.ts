/**
 * Student/Parent — warm, accessible soft palette
 * Derived from: Moodle's learner-facing UI (boost theme) + ERPNext Student module
 * Softer than the Institute palette, encouraging and non-intimidating.
 * Uses off-white backgrounds to reduce fatigue during study sessions.
 */
export const student = {
  bgBase: '#FAFBFC',
  bgSurface: '#FFFFFF',
  bgCard: '#F4F6F8',
  border: '#E2E8F0',
  text: '#1A202C',          // Chakra-exact slate-900 — warmer than GitHub's near-black
  muted: '#718096',
  // Accent: matches Moodle's learner accent (blue) — not purple like platform
  accent: '#3B82F6',        // blue-500 — matches Boost theme interactive elements
  accentLight: '#DBEAFE',
  // Assessment feedback states (mirrors Moodle quiz result styling)
  correct: '#16A34A',       // Moodle gradedright green
  incorrect: '#DC2626',     // Moodle gradedwrong red
  partial: '#D97706',       // Moodle gradedpartial amber
  // Streak / gamification
  streak: '#F97316',        // orange-500 per ERPNext student achievement color
  xp: '#EAB308',            // yellow-500 for XP/points
} as const

export type StudentToken = typeof student
