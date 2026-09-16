import { render, screen } from '@testing-library/react'

import { setControls } from '../../mocks/controls'
import { setupMockServer } from '../../mocks/handlers/__test__/setupMockServer'
import App from '../App'

// App now renders DashboardPage at "/", which fetches the merchant via the real (production)
// queryClient — so this file needs the mock server running, or that fetch would hit a real
// network call with no handler and retry against the app's real backoff schedule.
setupMockServer()

describe('App', () => {
  it('renders the app shell with the brand heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'NovaBiz' })).toBeInTheDocument()
  })

  it('loads and shows the dashboard balance', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    render(<App />)
    expect(await screen.findByText('Available balance')).toBeInTheDocument()
  })
})
