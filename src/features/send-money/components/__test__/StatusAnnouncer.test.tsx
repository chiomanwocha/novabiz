import { render, screen } from '@testing-library/react'

import { StatusAnnouncer } from '../StatusAnnouncer'

describe('StatusAnnouncer', () => {
  it('announces a normal status politely', () => {
    render(<StatusAnnouncer message="Checking account…" />)
    expect(screen.getByText('Checking account…')).toHaveAttribute('aria-live', 'polite')
  })

  it('announces a failure as an alert instead', () => {
    render(<StatusAnnouncer message="The transfer could not be completed." isError />)
    expect(screen.getByRole('alert')).toHaveTextContent('The transfer could not be completed.')
  })
})
