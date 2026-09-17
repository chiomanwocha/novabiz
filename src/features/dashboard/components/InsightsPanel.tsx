import type { MerchantDto } from '../../../api/types'
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
}

function GaugeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M4 16a8 8 0 1 1 16 0M12 16l4-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrendUpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M3 17l6-6 4 4 8-8M15 7h6v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 9.5h17M8 3v3.5M16 3v3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M6 3.5h12v17l-2.5-1.5L13 20.5l-2.5-1.5L8 20.5l-2-1.5V3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 8.5h6M9 12.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
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
export function InsightsPanel({ merchant }: InsightsPanelProps) {
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

  return (
    <section aria-label="Business insights" className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-text">Insights</h2>

      <div className="grid grid-flow-dense grid-cols-2 gap-3 lg:grid-cols-3">
        <InsightCard
          icon={<GaugeIcon />}
          iconTone="primary"
          label="Today's send limit"
          value={`${String(limitUsagePercent)}% used`}
          helperText={`${formatKobo(merchant.usedTodayKobo)} of ${formatKobo(merchant.dailyLimitKobo)}`}
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
              icon={<TrendUpIcon />}
              iconTone="success"
              label="Money in this week"
              value={formatKobo(insightsQuery.data.weekOverWeek.thisWeekInflowKobo)}
              helperText={weekTrend.summary}
              tone={weekTrend.direction}
            >
              <WeekComparisonBars
                thisWeekKobo={insightsQuery.data.weekOverWeek.thisWeekInflowKobo}
                lastWeekKobo={insightsQuery.data.weekOverWeek.lastWeekInflowKobo}
              />
            </InsightCard>
            <InsightCard
              icon={<StarIcon />}
              iconTone="accent"
              label="Top payer (last 30 days)"
              value={insightsQuery.data.topPayer?.name ?? 'Not enough data yet'}
              helperText={
                insightsQuery.data.topPayer
                  ? `${formatKobo(insightsQuery.data.topPayer.totalKobo)} · ${String(insightsQuery.data.topPayer.transactionCount)} payment${insightsQuery.data.topPayer.transactionCount === 1 ? '' : 's'}`
                  : undefined
              }
            />
            <InsightCard
              icon={<CalendarIcon />}
              iconTone="warning"
              label="Busiest day (last 30 days)"
              value={insightsQuery.data.busiestDay?.dayLabel ?? 'Not enough data yet'}
              helperText={
                insightsQuery.data.busiestDay
                  ? `${String(insightsQuery.data.busiestDay.transactionCount)} transactions`
                  : undefined
              }
            />
            <InsightCard
              icon={<ReceiptIcon />}
              label="Average sale (last 30 days)"
              value={
                insightsQuery.data.averageSaleKobo !== null
                  ? formatKobo(insightsQuery.data.averageSaleKobo)
                  : 'Not enough data yet'
              }
              helperText={
                insightsQuery.data.averageSaleKobo !== null
                  ? 'Per successful payment in'
                  : undefined
              }
            />
          </>
        )}
      </div>
    </section>
  )
}
