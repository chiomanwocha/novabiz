import { useState } from 'react'

import type { KycTier, MerchantDto } from '../../../api/types'
import { formatKobo } from '../../../lib/money'
import { Card } from '../../../shared/ui/Card'
import { dashboardCopy } from '../copy'

export interface BalanceSummaryProps {
  merchant: MerchantDto
}

const MASKED_BALANCE = '₦ • • • • • •'

const TIER_LABELS: Record<KycTier, string> = {
  1: 'Tier 1',
  2: 'Tier 2',
  3: 'Tier 3',
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.36 5.36A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a13.6 13.6 0 0 1-3.06 3.94M6.1 6.1C3.5 7.8 2 12 2 12a13.6 13.6 0 0 0 4.24 4.9A9.7 9.7 0 0 0 12 19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <path
        d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The dashboard's hero card — a light surface (not the old navy-gold gradient) so it doesn't
 * compete with the now-navy sidebar rail, with the balance figure as the clear headline, a
 * KYC tier badge for at-a-glance context, and an eye toggle so a merchant can hide the figure
 * on a shared screen. Direction is never colour alone (CLAUDE.md 6.7): the inflow/outflow
 * arrows carry a label and an icon alongside their green/red colour.
 */
export function BalanceSummary({ merchant }: BalanceSummaryProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)

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
            onClick={() => {
              setIsBalanceVisible((visible) => !visible)
            }}
            aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-hover hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {isBalanceVisible ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
          <ShieldIcon />
          {TIER_LABELS[merchant.kycTier]}
        </span>
      </div>
      <p className="relative mt-1 text-4xl font-bold tracking-tight text-primary">
        {isBalanceVisible ? formatKobo(merchant.balanceKobo) : MASKED_BALANCE}
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
            {formatKobo(merchant.todayInflowKobo)}
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
            {formatKobo(merchant.todayOutflowKobo)}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
