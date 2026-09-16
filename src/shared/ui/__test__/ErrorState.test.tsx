import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ErrorState } from '../ErrorState'

describe('ErrorState', () => {
  it('announces the message as an alert and calls onRetry when Retry is pressed', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState message="Could not load your account right now." onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load your account right now.')

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
