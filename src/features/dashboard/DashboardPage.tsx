import { useState } from 'react'

import { useMerchant } from '../../shared/hooks/useMerchant'
import { useRetry } from '../../shared/hooks/useRetry'
import { ErrorState } from '../../shared/ui/ErrorState'
import { LinkButton } from '../../shared/ui/LinkButton'
import { Skeleton } from '../../shared/ui/Skeleton'
import { VisuallyHidden } from '../../shared/ui/VisuallyHidden'

import { BalanceSummary } from './components/BalanceSummary'
import { InsightsPanel } from './components/InsightsPanel'
import { TransactionFeed } from './components/TransactionFeed'
import { TransactionFilters } from './components/TransactionFilters'
import { dashboardCopy } from './copy'
import { useTransactionFilterParams } from './hooks/useTransactionFilterParams'
import { buildGreeting } from './logic/greeting'

/** The dashboard's container: wires useMerchant to BalanceSummary and its loading/error states. */
export function DashboardPage() {
  const merchantQuery = useMerchant()
  const retryMerchant = useRetry(merchantQuery)
  const { filters, setFilters } = useTransactionFilterParams()
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)

  if (merchantQuery.isPending) {
    return (
      // Mirrors the real page section-for-section (greeting row, balance hero, insights
      // bento grid, filters toolbar, feed rows) rather than a handful of generic blocks —
      // the previous version used a 4-column insights grid (the real one is 3) and had
      // nothing at all standing in for the filters row or more than one feed row, so the
      // page visibly reflowed the moment real content replaced it.
      <div aria-busy="true" className="flex flex-col gap-5">
        <VisuallyHidden>{dashboardCopy.loadingLabel}</VisuallyHidden>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-11 w-36" />
        </div>
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-flow-dense grid-cols-2 gap-3 lg:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="col-span-2 h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <Skeleton className="h-11 w-full lg:w-80" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-border p-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    )
  }

  if (merchantQuery.isError) {
    return <ErrorState message={merchantQuery.error.message} onRetry={retryMerchant} />
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-text">
          {buildGreeting(merchantQuery.data.name)}
        </h1>
        <LinkButton to="/send">Send Money</LinkButton>
      </div>
      <BalanceSummary
        merchant={merchantQuery.data}
        isBalanceVisible={isBalanceVisible}
        onToggleVisibility={() => {
          setIsBalanceVisible((visible) => !visible)
        }}
      />
      <InsightsPanel merchant={merchantQuery.data} isBalanceVisible={isBalanceVisible} />
      <TransactionFilters value={filters} onChange={setFilters} />
      <TransactionFeed filters={filters} isAmountVisible={isBalanceVisible} />
    </div>
  )
}
