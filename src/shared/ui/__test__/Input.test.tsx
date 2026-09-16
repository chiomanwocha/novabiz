import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Input } from '../Input'

describe('Input', () => {
  it('associates the label with the input by role', () => {
    render(<Input label="Account number" />)
    expect(screen.getByLabelText('Account number')).toBeInTheDocument()
  })

  it('accepts typed input', async () => {
    const user = userEvent.setup()
    render(<Input label="Account number" />)

    const input = screen.getByLabelText('Account number')
    await user.type(input, '0102030400')

    expect(input).toHaveValue('0102030400')
  })

  it('shows a hint when there is no error', () => {
    render(<Input label="Account number" hint="10-digit account number" />)
    expect(screen.getByText('10-digit account number')).toBeInTheDocument()
  })

  it('marks the input invalid and links the error message via aria-describedby', () => {
    render(<Input label="Account number" error="Enter all 10 digits" />)

    const input = screen.getByLabelText('Account number')
    expect(input).toHaveAttribute('aria-invalid', 'true')

    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Enter all 10 digits')
    expect(input.getAttribute('aria-describedby')).toBe(error.id)
  })

  it('hides the hint once an error is present, so only the error is announced', () => {
    render(
      <Input label="Account number" hint="10-digit account number" error="Enter all 10 digits" />,
    )
    expect(screen.queryByText('10-digit account number')).not.toBeInTheDocument()
  })
})
