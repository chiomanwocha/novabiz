import { onlineManager } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'

import { OfflineBanner } from '../OfflineBanner'

describe('OfflineBanner', () => {
  afterEach(() => {
    onlineManager.setOnline(true)
  })

  it('renders nothing while online', () => {
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the offline message, with the *894# fallback, once offline', () => {
    render(<OfflineBanner />)

    act(() => {
      onlineManager.setOnline(false)
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      "You're offline — we'll retry when you're back. No data? Dial *894#.",
    )
  })

  it('disappears again once back online', () => {
    render(<OfflineBanner />)

    act(() => {
      onlineManager.setOnline(false)
    })
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      onlineManager.setOnline(true)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
