import type { MerchantDto } from '../../../api/types'
import { formatKobo } from '../../../lib/money'
import { Card } from '../../../shared/ui/Card'
import { dashboardCopy } from '../copy'

export interface BalanceSummaryProps {
  merchant: MerchantDto
}

/** The dashboard's hero card — the balance is the headline, today's totals are supporting detail. */
export function BalanceSummary({ merchant }: BalanceSummaryProps) {
  return (
    <Card>
      <p className="text-sm text-muted">{dashboardCopy.balanceLabel}</p>
      <p className="text-3xl font-semibold text-primary">{formatKobo(merchant.balanceKobo)}</p>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted">{dashboardCopy.todayInflowLabel}</dt>
          <dd className="text-lg font-medium text-success">
            {formatKobo(merchant.todayInflowKobo)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{dashboardCopy.todayOutflowLabel}</dt>
          <dd className="text-lg font-medium text-text">{formatKobo(merchant.todayOutflowKobo)}</dd>
        </div>
      </dl>
    </Card>
  )
}
