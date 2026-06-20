/**
 * Mentorship programme registration window configuration.
 * Update registrationDeadline to re-open or close applications site-wide.
 */

export const MENTORSHIP_CONFIG = {
  /** Absolute instant anchored to NZ time (UTC+13 NZDT in late March). */
  registrationDeadline: "2026-06-20T23:59:59+13:00",
} as const;

export function isMentorshipOpen(now: Date = new Date()): boolean {
  return now.getTime() < new Date(MENTORSHIP_CONFIG.registrationDeadline).getTime();
}
