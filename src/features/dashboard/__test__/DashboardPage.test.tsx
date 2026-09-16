import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { setControls } from '../../../mocks/controls'
import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { renderWithQueryClient } from '../../../test/renderWithQueryClient'
import { DashboardPage } from '../DashboardPage'

setupMockServer()

describe('DashboardPage', () => {
  it('shows the balance once the merchant loads', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    renderWithQueryClient(<DashboardPage />)
    expect(await screen.findByText('Available balance')).toBeInTheDocument()
  })

  it('shows an error with Retry when the merchant fails to load, and recovers on retry', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<DashboardPage />)

    const retryButton = await screen.findByRole('button', { name: 'Retry' })
    expect(screen.getByRole('alert')).toBeInTheDocument()

    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Available balance')).toBeInTheDocument()
    })
  })
})
