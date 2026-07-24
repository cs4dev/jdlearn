// Résumé-import rate limit (SPEC v3.3): one import per user per rolling 30-day window.
// Pure + tested so the policy has a single home; the server supplies persistence + `now`.

export const RESUME_IMPORT_WINDOW_DAYS = 30;
const WINDOW_MS = RESUME_IMPORT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export interface RateLimitResult {
  allowed: boolean;
  /** ISO timestamp the next import becomes allowed, or null when allowed now. */
  nextAllowedAt: string | null;
}

/**
 * Decide whether a user may import a résumé, given their last import time.
 * A rolling window (last + 30 days) — not a calendar month — so an import late in one
 * month doesn't unlock another the next day.
 */
export function canImportResume(
  lastImportAt: string | null | undefined,
  now: Date,
): RateLimitResult {
  if (!lastImportAt) return { allowed: true, nextAllowedAt: null };
  const next = new Date(new Date(lastImportAt).getTime() + WINDOW_MS);
  if (now.getTime() >= next.getTime()) return { allowed: true, nextAllowedAt: null };
  return { allowed: false, nextAllowedAt: next.toISOString() };
}
