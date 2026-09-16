import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { BankDto } from '../../../../api/types'
import { BankSelect } from '../BankSelect'

const BANKS: BankDto[] = [
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '058', name: 'Guaranty Trust Bank' },
]

describe('BankSelect', () => {
  it('lists every bank and calls onChange with the chosen code', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<BankSelect banks={BANKS} value="" onChange={onChange} />)

    expect(screen.getByRole('option', { name: 'First Bank of Nigeria' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Guaranty Trust Bank' })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Bank'), '058')
    expect(onChange).toHaveBeenCalledWith('058')
  })
})
