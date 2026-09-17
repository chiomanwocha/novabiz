import { render, screen } from '@testing-library/react'

import type { TransactionDto } from '../../../../api/types'
import { toKobo } from '../../../../lib/money'
import { TransactionRow } from '../TransactionRow'

function buildTransaction(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: 'seed-0001',
    type: 'credit',
    status: 'successful',
    amountKobo: toKobo(150_000),
    counterpartyName: 'Chidinma Okafor',
    counterpartyAccountNumber: '0102030409',
    counterpartyBankCode: '011',
    counterpartyBankName: 'First Bank of Nigeria',
    description: 'For provisions',
    occurredAt: '2026-09-16T09:30:00.000Z',
    ...overrides,
  }
}

describe('TransactionRow', () => {
  it('shows the counterparty, a signed formatted amount, and a status badge', () => {
    render(<TransactionRow transaction={buildTransaction()} />)

    expect(screen.getByText('Chidinma Okafor')).toBeInTheDocument()
    expect(screen.getByText('+₦1,500.00')).toBeInTheDocument()
    expect(screen.getByText('Successful')).toBeInTheDocument()
  })

  it('shows the complete date (day, month, year) alongside the time, not just the time', () => {
    render(
      <TransactionRow transaction={buildTransaction({ occurredAt: '2026-09-16T09:30:00.000Z' })} />,
    )

    expect(screen.getByText(/16 sept 2026/i)).toBeInTheDocument()
  })

  it('shows a debit with a minus sign', () => {
    render(<TransactionRow transaction={buildTransaction({ type: 'debit' })} />)
    expect(screen.getByText('-₦1,500.00')).toBeInTheDocument()
  })

  // A persistent tint on pending rows (matching the hover colour) was tried and reverted —
  // a pending row keeps the plain white/surface background like every other row,
  // distinguished only by its "Pending" badge.
  it('gives a pending row the same plain background as any other row, not a tint', () => {
    const { container: pendingContainer } = render(
      <TransactionRow transaction={buildTransaction({ status: 'pending' })} />,
    )
    const { container: successfulContainer } = render(
      <TransactionRow transaction={buildTransaction({ status: 'successful' })} />,
    )

    expect(pendingContainer.firstChild).not.toHaveClass('bg-text/5')
    expect(successfulContainer.firstChild).not.toHaveClass('bg-text/5')
  })

  it('renders a hostile img description as literal text, never as a real element', () => {
    const hostile = '<img src=x onerror=alert(1)>'
    const { container } = render(
      <TransactionRow transaction={buildTransaction({ description: hostile })} />,
    )

    expect(screen.getByText(hostile)).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('renders a hostile script description as literal text, never executing it', () => {
    const hostile = "<script>alert('x')</script>"
    const { container } = render(
      <TransactionRow transaction={buildTransaction({ description: hostile })} />,
    )

    expect(screen.getByText(hostile)).toBeInTheDocument()
    expect(container.querySelector('script')).not.toBeInTheDocument()
  })
})
