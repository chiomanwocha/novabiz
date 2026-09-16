import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'

import { AccountNumberField } from '../AccountNumberField'

function ControlledField({
  bankCode,
  bankName,
}: {
  bankCode: string | null
  bankName: string | null
}) {
  const [value, setValue] = useState('')
  return (
    <AccountNumberField value={value} onChange={setValue} bankCode={bankCode} bankName={bankName} />
  )
}

describe('AccountNumberField', () => {
  it('has the required numeric-input attributes and hint', () => {
    render(<AccountNumberField value="" onChange={vi.fn()} bankCode={null} bankName={null} />)

    const field = screen.getByLabelText('Account number')
    expect(field).toHaveAttribute('inputmode', 'numeric')
    expect(field).toHaveAttribute('autocomplete', 'off')
    expect(screen.getByText('10-digit account number')).toBeInTheDocument()
  })

  it('sanitises typed input, stripping non-digits', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    await user.type(screen.getByLabelText('Account number'), '01-02 03')
    expect(screen.getByLabelText('Account number')).toHaveValue('010203')
  })

  it('sanitises a pasted value instead of silently truncating it', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    const field = screen.getByLabelText('Account number')
    field.focus()
    await user.paste('0123 456 789')

    expect(field).toHaveValue('0123456789')
  })

  it('shows "Enter all 10 digits" for a number that is too short', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    await user.type(screen.getByLabelText('Account number'), '12345')
    expect(screen.getByText('Enter all 10 digits')).toBeInTheDocument()
  })

  it('shows "Enter all 10 digits" for a number that is too long, without truncating it', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    await user.type(screen.getByLabelText('Account number'), '123456789012')
    expect(screen.getByLabelText('Account number')).toHaveValue('123456789012')
    expect(screen.getByText('Enter all 10 digits')).toBeInTheDocument()
  })

  it("shows a bank-specific error for 10 digits that fail the bank's check digit", async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode="011" bankName="First Bank of Nigeria" />)

    await user.type(screen.getByLabelText('Account number'), '1234567890')
    expect(
      screen.getByText(
        "This account number doesn't look right for First Bank of Nigeria. Please check it.",
      ),
    ).toBeInTheDocument()
  })

  it('shows no error for a valid 10-digit number that passes the check digit', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode="011" bankName="First Bank of Nigeria" />)

    await user.type(screen.getByLabelText('Account number'), '0102030400')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
