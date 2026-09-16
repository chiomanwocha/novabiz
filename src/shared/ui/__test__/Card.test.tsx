import { render, screen } from '@testing-library/react'

import { Card } from '../Card'

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <p>Balance</p>
      </Card>,
    )
    expect(screen.getByText('Balance')).toBeInTheDocument()
  })
})
