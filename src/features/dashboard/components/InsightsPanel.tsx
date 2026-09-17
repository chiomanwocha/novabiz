import { Calendar, Gauge, Receipt, Star, TrendingUp } from 'lucide-react'

import type { MerchantDto } from '../../../api/types'
import { formatCount } from '../../../lib/format'
import { formatKobo } from '../../../lib/money'
import { useRetry } from '../../../shared/hooks/useRetry'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { Skeleton } from '../../../shared/ui/Skeleton'
import { VisuallyHidden } from '../../../shared/ui/VisuallyHidden'
import { dashboardCopy } from '../copy'
import { useInsights } from '../hooks/useInsights'
import { describeWeekOverWeekTrend } from '../logic/formatTrend'
import { computeLimitUsagePercent } from '../logic/limitUsage'

import { InsightCard } from './InsightCard'
import { WeekComparisonBars } from './WeekComparisonBars'

export interface InsightsPanelProps {
  merchant: MerchantDto
  /** Mirrors BalanceSummary's toggle — CLAUDE.md 6.7 aside, a merchant hiding the balance on a
   * shared screen expects every money figure on the page to hide with it, not just the hero card. */
  isBalanceVisible: boolean
}

/**
 * At-a-glance business metrics beneath the hero balance card — the numbers a merchant
 * actually checks day to day, not charts. A bento layout (the week card spans 2 columns,
 * grid-flow-dense backfills any gap on narrower screens) instead of 4-5 equal boxes, so the
 * panel reads as deliberate rather than a row of identical, half-empty tiles. The transfer-
 * limit gauge reuses merchant data already on the page; the rest come from
 * /api/merchant/insights, computed server-side from the same seeded transaction feed the
 * feed below reads.
 */
export function InsightsPanel({ merchant, isBalanceVisible }: InsightsPanelProps) {
  const insightsQuery = useInsights()
  const retryInsights = useRetry(insightsQuery)
  const limitUsagePercent = computeLimitUsagePercent(
    merchant.usedTodayKobo,
    merchant.dailyLimitKobo,
  )
  const weekTrend = insightsQuery.data
    ? describeWeekOverWeekTrend(
        insightsQuery.data.weekOverWeek.thisWeekInflowKobo,
        insightsQuery.data.weekOverWeek.lastWeekInflowKobo,
      )
    : null

  // Every InsightCard value/helperText below runs through this — the hide-balance toggle
  // (CLAUDE.md 6.7's shared-screen concern) is meant to hide every figure on the dashboard,
  // not just the hero balance card.
  const figure = (text: string): string => (isBalanceVisible ? text : dashboardCopy.maskedFigure)

  return (
    <section aria-label="Business insights" className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-text">Insights</h2>

      <div className="grid grid-flow-dense grid-cols-2 gap-3 lg:grid-cols-3">
        <InsightCard
          icon={<Gauge aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />}
          iconTone="primary"
          label="Today's send limit"
          value={figure(`${String(limitUsagePercent)}% used`)}
          helperText={figure(
            `${formatKobo(merchant.usedTodayKobo)} of ${formatKobo(merchant.dailyLimitKobo)}`,
          )}
          tone={limitUsagePercent >= 90 ? 'down' : 'flat'}
          progressPercent={limitUsagePercent}
        />

        {insightsQuery.isPending && (
          <>
            <VisuallyHidden>{dashboardCopy.insightsLoadingLabel}</VisuallyHidden>
            <Skeleton className="col-span-2 h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        )}

        {insightsQuery.isError && (
          <div className="col-span-2 lg:col-span-3">
            <ErrorState message={insightsQuery.error.message} onRetry={retryInsights} />
          </div>
        )}

        {insightsQuery.isSuccess && weekTrend && (
          <>
            <InsightCard
              wide
              icon={<TrendingUp aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />}
              iconTone="success"
              label="Money in this week"
              value={figure(formatKobo(insightsQuery.data.weekOverWeek.thisWeekInflowKobo))}
              helperText={figure(weekTrend.summary)}
              tone={weekTrend.direction}
            >
              <WeekComparisonBars
                thisWeekKobo={insightsQuery.data.weekOverWeek.thisWeekInflowKobo}
                lastWeekKobo={insightsQuery.data.weekOverWeek.lastWeekInflowKobo}
              />
            </InsightCard>
            <InsightCard
              icon={<Star aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />}
              iconTone="accent"
              label="Top payer (last 30 days)"
              value={insightsQuery.data.topPayer?.name ?? 'Not enough data yet'}
              helperText={
                insightsQuery.data.topPayer
                  ? figure(
                      `${formatKobo(insightsQuery.data.topPayer.totalKobo)} received · ${formatCount(insightsQuery.data.topPayer.transactionCount)} payment${insightsQuery.data.topPayer.transactionCount === 1 ? '' : 's'}`,
                    )
                  : undefined
              }
            />
            <InsightCard
              icon={<Calendar aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />}
              iconTone="warning"
              label="Busiest day (last 30 days)"
              value={insightsQuery.data.busiestDay?.dayLabel ?? 'Not enough data yet'}
              helperText={
                insightsQuery.data.busiestDay
                  ? figure(
                      `${formatCount(insightsQuery.data.busiestDay.transactionCount)} transactions`,
                    )
                  : undefined
              }
            />
            <InsightCard
              icon={<Receipt aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />}
              label="Average sale (last 30 days)"
              value={
                insightsQuery.data.averageSaleKobo !== null
                  ? figure(formatKobo(insightsQuery.data.averageSaleKobo))
                  : 'Not enough data yet'
              }
              helperText={
                insightsQuery.data.averageSaleKobo !== null ? 'Per successful payment' : undefined
              }
            />
          </>
        )}
      </div>
    </section>
  )
}
