import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from '../Button'

describe('Button', () => {
  it('renders its label and responds to a click', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Send Money</Button>)

    const button = screen.getByRole('button', { name: 'Send Money' })
    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled and unclickable when disabled is set', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Send Money
      </Button>,
    )

    await user.click(screen.getByRole('button', { name: 'Send Money' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('defaults to type="button" so it never submits a surrounding form by accident', () => {
    render(<Button>Cancel</Button>)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button')
  })
})
