import { sumKobo, toKobo, type Kobo } from '../../lib/money'

import type { BusiestDayInsight, MerchantInsights, TopPayerInsight, Transaction } from './types'

const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS
const RECENT_WINDOW_MS = 30 * DAY_MS

const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

function occurredAtMs(transaction: Transaction): number {
  return new Date(transaction.occurredAt).getTime()
}

function dayLabelOf(isoTimestamp: string): string {
  const label = DAY_LABELS[new Date(isoTimestamp).getDay()]
  if (!label) {
    throw new Error('Unreachable: Date#getDay() always returns 0-6')
  }
  return label
}

function computeWeekOverWeek(
  successful: readonly Transaction[],
  now: number,
): MerchantInsights['weekOverWeek'] {
  const thisWeekStart = now - WEEK_MS
  const lastWeekStart = now - 2 * WEEK_MS

  const thisWeekInflowKobo = sumKobo(
    successful
      .filter((t) => t.type === 'credit' && occurredAtMs(t) >= thisWeekStart)
      .map((t) => t.amountKobo),
  )
  const lastWeekInflowKobo = sumKobo(
    successful
      .filter(
        (t) =>
          t.type === 'credit' &&
          occurredAtMs(t) >= lastWeekStart &&
          occurredAtMs(t) < thisWeekStart,
      )
      .map((t) => t.amountKobo),
  )

  return { thisWeekInflowKobo, lastWeekInflowKobo }
}

function computeTopPayer(recentCredits: readonly Transaction[]): TopPayerInsight | null {
  const totals = new Map<string, { totalKobo: number; transactionCount: number }>()
  for (const transaction of recentCredits) {
    const existing = totals.get(transaction.counterpartyName) ?? {
      totalKobo: 0,
      transactionCount: 0,
    }
    totals.set(transaction.counterpartyName, {
      totalKobo: existing.totalKobo + transaction.amountKobo,
      transactionCount: existing.transactionCount + 1,
    })
  }

  let top: TopPayerInsight | null = null
  for (const [name, totals_] of totals) {
    if (!top || totals_.totalKobo > top.totalKobo) {
      top = {
        name,
        totalKobo: toKobo(totals_.totalKobo),
        transactionCount: totals_.transactionCount,
      }
    }
  }
  return top
}

function computeAverageSale(recentCredits: readonly Transaction[]): Kobo | null {
  if (recentCredits.length === 0) {
    return null
  }
  const total = sumKobo(recentCredits.map((t) => t.amountKobo))
  return toKobo(Math.round(total / recentCredits.length))
}

function computeBusiestDay(recent: readonly Transaction[]): BusiestDayInsight | null {
  const counts = new Map<string, number>()
  for (const transaction of recent) {
    const label = dayLabelOf(transaction.occurredAt)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  let busiest: BusiestDayInsight | null = null
  for (const [dayLabel, transactionCount] of counts) {
    if (!busiest || transactionCount > busiest.transactionCount) {
      busiest = { dayLabel, transactionCount }
    }
  }
  return busiest
}

/**
 * Computed from the same seeded transaction feed the dashboard's own feed reads — there is
 * no separate insights dataset to keep in sync. Run inside the mock handler (server-side),
 * same as transaction filtering, rather than in the browser.
 */
export function computeInsights(
  transactions: readonly Transaction[],
  now: number,
): MerchantInsights {
  const successful = transactions.filter((t) => t.status === 'successful')
  const recentWindow = successful.filter((t) => occurredAtMs(t) >= now - RECENT_WINDOW_MS)
  const recentCredits = recentWindow.filter((t) => t.type === 'credit')

  return {
    weekOverWeek: computeWeekOverWeek(successful, now),
    topPayer: computeTopPayer(recentCredits),
    busiestDay: computeBusiestDay(recentWindow),
    averageSaleKobo: computeAverageSale(recentCredits),
  }
}
