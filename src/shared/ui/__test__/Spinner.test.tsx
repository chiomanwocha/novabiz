import { render, screen } from '@testing-library/react'

import { Spinner } from '../Spinner'

describe('Spinner', () => {
  it('announces the default "Loading…" label via role="status"', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
  })

  it('announces a custom label when given one', () => {
    render(<Spinner label="Checking account…" />)
    expect(screen.getByRole('status')).toHaveTextContent('Checking account…')
  })
})
