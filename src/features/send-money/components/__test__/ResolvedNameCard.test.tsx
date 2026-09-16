import { render, screen } from '@testing-library/react'

import { ResolvedNameCard } from '../ResolvedNameCard'

describe('ResolvedNameCard', () => {
  it('shows the name, bank, and a masked account number', () => {
    render(
      <ResolvedNameCard
        accountName="Chidinma Okafor"
        bankName="First Bank of Nigeria"
        accountNumber="0102030400"
      />,
    )

    expect(screen.getByText('Chidinma Okafor')).toBeInTheDocument()
    expect(screen.getByText(/First Bank of Nigeria/)).toBeInTheDocument()
    expect(screen.getByText(/\*+0400/)).toBeInTheDocument()
  })

  it('renders a hostile name as literal text, never as a real element', () => {
    const hostile = '<img src=x onerror=alert(1)>'
    const { container } = render(
      <ResolvedNameCard
        accountName={hostile}
        bankName="First Bank of Nigeria"
        accountNumber="0102030400"
      />,
    )

    expect(screen.getByText(hostile)).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
