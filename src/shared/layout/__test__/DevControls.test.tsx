import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { getControls, setControls } from '../../../mocks/controls'
import { DevControls } from '../DevControls'

describe('DevControls', () => {
  afterEach(() => {
    setControls({ fixedLatencyMs: null, failRate: 0, timeoutMode: false })
  })

  it('reflects the current controls on mount', () => {
    setControls({ fixedLatencyMs: 0, failRate: 0.5, timeoutMode: true })
    render(<DevControls />)

    expect(screen.getByLabelText('Latency')).toHaveValue('0')
    expect(screen.getByLabelText(/Failure rate/)).toHaveValue('0.5')
    expect(screen.getByLabelText('Timeout mode')).toBeChecked()
  })

  it('updates the shared controls module when the failure rate changes', async () => {
    const user = userEvent.setup()
    render(<DevControls />)

    await user.click(screen.getByLabelText('Timeout mode'))

    expect(getControls().timeoutMode).toBe(true)
  })

  it('updates the shared controls module when latency changes', async () => {
    const user = userEvent.setup()
    render(<DevControls />)

    await user.selectOptions(screen.getByLabelText('Latency'), 'Instant (0ms)')

    expect(getControls().fixedLatencyMs).toBe(0)
  })
})
