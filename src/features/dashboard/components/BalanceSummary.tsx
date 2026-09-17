import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

import type { KycTier, MerchantDto } from '../../../api/types'
import { formatKobo } from '../../../lib/money'
import { Card } from '../../../shared/ui/Card'
import { dashboardCopy } from '../copy'

export interface BalanceSummaryProps {
  merchant: MerchantDto
  /** Lifted to DashboardPage so InsightsPanel and TransactionRow amounts mask together with
   * this card's own figures — CLAUDE.md's "single source of truth" for shared UI state. */
  isBalanceVisible: boolean
  onToggleVisibility: () => void
}

const TIER_LABELS: Record<KycTier, string> = {
  1: 'Tier 1',
  2: 'Tier 2',
  3: 'Tier 3',
}

/**
 * The dashboard's hero card — a light surface (not the old navy-gold gradient) so it doesn't
 * compete with the now-navy sidebar rail, with the balance figure as the clear headline, a
 * KYC tier badge for at-a-glance context, and an eye toggle so a merchant can hide the figure
 * on a shared screen. Direction is never colour alone (CLAUDE.md 6.7): the inflow/outflow
 * arrows carry a label and an icon alongside their green/red colour.
 */
export function BalanceSummary({
  merchant,
  isBalanceVisible,
  onToggleVisibility,
}: BalanceSummaryProps) {
  return (
    <Card className="relative overflow-hidden p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-muted">{dashboardCopy.balanceLabel}</p>
          <button
            type="button"
            onClick={onToggleVisibility}
            aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-hover hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {isBalanceVisible ? (
              <Eye aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            ) : (
              <EyeOff aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
            )}
          </button>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-surface-hover px-2.5 py-1 text-xs font-semibold text-primary">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
          {TIER_LABELS[merchant.kycTier]}
        </span>
      </div>
      <p className="relative mt-1 text-4xl font-bold tracking-tight text-primary">
        {isBalanceVisible ? formatKobo(merchant.balanceKobo) : dashboardCopy.maskedFigure}
      </p>
      <dl className="relative mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <span aria-hidden="true" className="text-success">
              ↓
            </span>
            {dashboardCopy.todayInflowLabel}
          </dt>
          <dd className="mt-1 text-lg font-semibold text-success">
            {isBalanceVisible ? formatKobo(merchant.todayInflowKobo) : dashboardCopy.maskedFigure}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <span aria-hidden="true" className="text-danger">
              ↑
            </span>
            {dashboardCopy.todayOutflowLabel}
          </dt>
          <dd className="mt-1 text-lg font-semibold text-danger">
            {isBalanceVisible ? formatKobo(merchant.todayOutflowKobo) : dashboardCopy.maskedFigure}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
