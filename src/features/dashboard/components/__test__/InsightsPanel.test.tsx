import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { MerchantDto } from '../../../../api/types'
import { toKobo } from '../../../../lib/money'
import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { renderWithQueryClient } from '../../../../test/renderWithQueryClient'
import { InsightsPanel } from '../InsightsPanel'

setupMockServer()

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

describe('InsightsPanel', () => {
  it("shows the transfer-limit gauge computed from the merchant's own data straight away", () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    renderWithQueryClient(<InsightsPanel merchant={MERCHANT} />)

    expect(screen.getByText('15% used')).toBeInTheDocument()
  })

  it('shows the week, top-payer, busiest-day, and average-sale cards once insights load', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    renderWithQueryClient(<InsightsPanel merchant={MERCHANT} />)

    expect(await screen.findByText('Money in this week')).toBeInTheDocument()
    expect(screen.getByText('Top payer (last 30 days)')).toBeInTheDocument()
    expect(screen.getByText('Busiest day (last 30 days)')).toBeInTheDocument()
    expect(screen.getByText('Average sale (last 30 days)')).toBeInTheDocument()
  })

  it('shows an error with Retry when insights fail to load, and recovers on retry', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<InsightsPanel merchant={MERCHANT} />)

    const retryButton = await screen.findByRole('button', { name: 'Retry' })
    expect(screen.getByRole('alert')).toBeInTheDocument()

    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    await user.click(retryButton)

    expect(await screen.findByText('Money in this week')).toBeInTheDocument()
  })
})
