import { render, screen } from '@testing-library/react'

import type { MerchantDto } from '../../../../api/types'
import { toKobo } from '../../../../lib/money'
import { BalanceSummary } from '../BalanceSummary'

const MERCHANT: MerchantDto = {
  name: "Amaka's Provisions Store",
  accountNumber: '0102030409',
  bankCode: '058',
  balanceKobo: toKobo(31_450_075),
  todayInflowKobo: toKobo(500_000),
  todayOutflowKobo: toKobo(300_000),
  kycTier: 2,
  singleTransferLimitKobo: toKobo(500_000),
  dailyLimitKobo: toKobo(2_000_000),
  usedTodayKobo: toKobo(300_000),
}

describe('BalanceSummary', () => {
  it('formats the balance and today totals as Naira, never as raw kobo', () => {
    render(<BalanceSummary merchant={MERCHANT} />)

    expect(screen.getByText('₦314,500.75')).toBeInTheDocument()
    expect(screen.getByText('₦5,000.00')).toBeInTheDocument()
    expect(screen.getByText('₦3,000.00')).toBeInTheDocument()
  })
})
