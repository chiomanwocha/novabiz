import { ErrorState } from '../../shared/ui/ErrorState'
import { Skeleton } from '../../shared/ui/Skeleton'
import { VisuallyHidden } from '../../shared/ui/VisuallyHidden'

import { BalanceSummary } from './components/BalanceSummary'
import { TransactionFeed } from './components/TransactionFeed'
import { dashboardCopy } from './copy'
import { useMerchant } from './hooks/useMerchant'

/** The dashboard's container: wires useMerchant to BalanceSummary and its loading/error states. */
export function DashboardPage() {
  const merchantQuery = useMerchant()

  if (merchantQuery.isPending) {
    return (
      <div aria-busy="true">
        <VisuallyHidden>{dashboardCopy.loadingLabel}</VisuallyHidden>
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (merchantQuery.isError) {
    return (
      <ErrorState
        message={merchantQuery.error.message}
        onRetry={() => void merchantQuery.refetch()}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BalanceSummary merchant={merchantQuery.data} />
      <TransactionFeed />
    </div>
  )
}
