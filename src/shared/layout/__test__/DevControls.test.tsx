import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { getControls, setControls } from '../../../mocks/controls'
import { DevControls } from '../DevControls'

describe('DevControls', () => {
  afterEach(() => {
    setControls({ fixedLatencyMs: null, failRate: 0, timeoutMode: false })
  })

  // Regression case: the panel used to be a full-width labelled box sitting directly on top
  // of the mobile bottom tab bar. Collapsing it to an icon keeps the same accessible name
  // (via aria-label, since there's no longer visible text) without blocking navigation.
  it('collapses to a small icon button with an accessible name, not the full panel text', () => {
    render(<DevControls />)

    expect(screen.getByLabelText('Mock controls').tagName).toBe('SUMMARY')
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
