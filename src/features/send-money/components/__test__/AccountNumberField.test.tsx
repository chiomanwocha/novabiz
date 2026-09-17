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
  it('has the required numeric-input attributes, hint, and a 10-character max length', () => {
    render(<AccountNumberField value="" onChange={vi.fn()} bankCode={null} bankName={null} />)

    const field = screen.getByLabelText('Account number')
    expect(field).toHaveAttribute('inputmode', 'numeric')
    expect(field).toHaveAttribute('autocomplete', 'off')
    expect(field).toHaveAttribute('maxlength', '10')
    expect(screen.getByText('10-digit account number')).toBeInTheDocument()
  })

  it('sanitises typed input, stripping non-digits', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    await user.type(screen.getByLabelText('Account number'), '01-02 03')
    expect(screen.getByLabelText('Account number')).toHaveValue('010203')
  })

  it('stops accepting further keystrokes once 10 characters have been typed', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    await user.type(screen.getByLabelText('Account number'), '123456789012')
    expect(screen.getByLabelText('Account number')).toHaveValue('1234567890')
  })

  it('sanitises a pasted value instead of silently truncating it, even past 10 digits', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    const field = screen.getByLabelText('Account number')
    field.focus()
    await user.paste('0123 456 789 012')

    expect(field).toHaveValue('0123456789012')
  })

  it('shows no error while typing, only after the field is blurred', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    await user.type(screen.getByLabelText('Account number'), '12345')
    expect(screen.queryByText('Enter all 10 digits')).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByText('Enter all 10 digits')).toBeInTheDocument()
  })

  it('shows "Enter all 10 digits" on blur for a pasted number that is too long, without truncating it', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    const field = screen.getByLabelText('Account number')
    field.focus()
    await user.paste('123456789012')
    await user.tab()

    expect(field).toHaveValue('123456789012')
    expect(screen.getByText('Enter all 10 digits')).toBeInTheDocument()
  })

  it('clears a blur-shown error immediately once typing resumes, until the next blur', async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode={null} bankName={null} />)

    const field = screen.getByLabelText('Account number')
    await user.type(field, '12345')
    await user.tab()
    expect(screen.getByText('Enter all 10 digits')).toBeInTheDocument()

    field.focus()
    await user.keyboard('67890')
    expect(screen.queryByText('Enter all 10 digits')).not.toBeInTheDocument()
  })

  it("shows a bank-specific error on blur for 10 digits that fail the bank's check digit", async () => {
    const user = userEvent.setup()
    render(<ControlledField bankCode="011" bankName="First Bank of Nigeria" />)

    await user.type(screen.getByLabelText('Account number'), '1234567890')
    await user.tab()
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
    await user.tab()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
