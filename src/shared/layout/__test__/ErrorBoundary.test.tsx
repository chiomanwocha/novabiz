import { render, screen } from '@testing-library/react'

import { ErrorBoundary } from '../ErrorBoundary'

function Bomb(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('shows the graceful fallback instead of a blank page when a child throws', () => {
    // React logs the caught error to the console by design — silence just this test's expected
    // noise rather than the whole suite's.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})
