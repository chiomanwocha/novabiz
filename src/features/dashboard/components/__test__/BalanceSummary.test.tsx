import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
    render(<BalanceSummary merchant={MERCHANT} isBalanceVisible onToggleVisibility={vi.fn()} />)

    expect(screen.getByText('₦314,500.75')).toBeInTheDocument()
    expect(screen.getByText('₦5,000.00')).toBeInTheDocument()
    expect(screen.getByText('₦3,000.00')).toBeInTheDocument()
  })

  it('shows the merchant KYC tier', () => {
    render(<BalanceSummary merchant={MERCHANT} isBalanceVisible onToggleVisibility={vi.fn()} />)

    expect(screen.getByText('Tier 2')).toBeInTheDocument()
  })

  // Hiding used to mask only the hero balance figure and leave today's totals visible, which
  // defeats the point of a shared-screen privacy toggle, so all three now mask together. The
  // toggle's own state now lives in DashboardPage (so it can reach InsightsPanel/
  // TransactionFeed too), so this component is tested as the controlled component it now is,
  // not as the owner of its own visibility state.
  it('masks the balance and today totals together when isBalanceVisible is false', () => {
    render(
      <BalanceSummary merchant={MERCHANT} isBalanceVisible={false} onToggleVisibility={vi.fn()} />,
    )

    expect(screen.queryByText('₦314,500.75')).not.toBeInTheDocument()
    expect(screen.queryByText('₦5,000.00')).not.toBeInTheDocument()
    expect(screen.queryByText('₦3,000.00')).not.toBeInTheDocument()
    expect(screen.getAllByText('••••')).toHaveLength(3)
  })

  it('calls onToggleVisibility when the eye button is clicked', async () => {
    const user = userEvent.setup()
    const onToggleVisibility = vi.fn()
    render(
      <BalanceSummary
        merchant={MERCHANT}
        isBalanceVisible
        onToggleVisibility={onToggleVisibility}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Hide balance' }))
    expect(onToggleVisibility).toHaveBeenCalledOnce()
  })
})
