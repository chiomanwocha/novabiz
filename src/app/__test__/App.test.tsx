import { render, screen } from '@testing-library/react'

import { setControls } from '../../mocks/controls'
import { setupMockServer } from '../../mocks/handlers/__test__/setupMockServer'
import App from '../App'

// App now renders DashboardPage at "/", which fetches the merchant via the real (production)
// queryClient — so this file needs the mock server running, or that fetch would hit a real
// network call with no handler and retry against the app's real backoff schedule.
setupMockServer()

describe('App', () => {
  it('renders the app shell with the brand', () => {
    render(<App />)
    // Rendered once in the mobile header and once atop the desktop sidebar, toggled with
    // CSS rather than JS, so both exist in the DOM regardless of viewport.
    expect(screen.getAllByText('NovaBiz').length).toBeGreaterThan(0)
  })

  it('loads and shows the dashboard balance', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    render(<App />)
    // RTL's default findBy timeout (1000ms) is occasionally too tight for this file's very
    // first render under full-suite CPU contention, even with mock latency pinned to 0 —
    // a known flake pattern, not a real regression.
    expect(await screen.findByText('Available balance', {}, { timeout: 5000 })).toBeInTheDocument()
  })
})
