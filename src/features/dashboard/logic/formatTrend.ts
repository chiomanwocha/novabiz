import type { Kobo } from '../../../lib/money'

export type TrendDirection = 'up' | 'down' | 'flat'

export interface Trend {
  direction: TrendDirection
  summary: string
}

/**
 * Compares this week's inflow to last week's. A zero last week (a new merchant, or a
 * quiet week with nothing in) makes a percentage change meaningless, so that case gets
 * its own wording instead of dividing by zero.
 */
export function describeWeekOverWeekTrend(thisWeekKobo: Kobo, lastWeekKobo: Kobo): Trend {
  if (lastWeekKobo === 0) {
    return thisWeekKobo === 0
      ? { direction: 'flat', summary: 'No money in yet this week' }
      : { direction: 'up', summary: 'New this week' }
  }

  const changePercent = Math.round(((thisWeekKobo - lastWeekKobo) / lastWeekKobo) * 100)

  if (changePercent === 0) {
    return { direction: 'flat', summary: 'Same as last week' }
  }

  const direction: TrendDirection = changePercent > 0 ? 'up' : 'down'
  const sign = changePercent > 0 ? '+' : ''
  return { direction, summary: `${sign}${String(changePercent)}% vs last week` }
}
