import type { Kobo } from '../../../lib/money'

/** Percentage of today's transfer limit already used, clamped to [0, 100]. Guards a zero limit. */
export function computeLimitUsagePercent(usedKobo: Kobo, dailyLimitKobo: Kobo): number {
  if (dailyLimitKobo <= 0) {
    return 0
  }
  const percent = (usedKobo / dailyLimitKobo) * 100
  return Math.min(100, Math.max(0, Math.round(percent)))
}
