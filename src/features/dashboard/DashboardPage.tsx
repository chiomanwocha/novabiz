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

  if (merchantQuery.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <VisuallyHidden>{dashboardCopy.loadingLabel}</VisuallyHidden>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
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
      <BalanceSummary merchant={merchantQuery.data} />
      <InsightsPanel merchant={merchantQuery.data} />
      <TransactionFilters value={filters} onChange={setFilters} />
      <TransactionFeed filters={filters} />
    </div>
  )
}
