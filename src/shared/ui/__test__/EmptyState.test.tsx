import { render, screen } from '@testing-library/react'

import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('shows the title and, when given, the description and action', () => {
    render(
      <EmptyState
        title="No transactions yet"
        description="Money in and out will show up here."
        action={<button type="button">Send Money</button>}
      />,
    )

    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    expect(screen.getByText('Money in and out will show up here.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Money' })).toBeInTheDocument()
  })

  it('renders without a description or action when none is given', () => {
    render(<EmptyState title="No transactions yet" />)
    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
  })
})
