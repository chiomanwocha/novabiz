import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { TransactionFilters as FiltersValue } from '../../hooks/useTransactions'
import { TransactionFilters } from '../TransactionFilters'

const EMPTY_FILTERS: FiltersValue = { from: null, to: null, status: null, type: null, q: null }

describe('TransactionFilters', () => {
  it('applies a status change immediately', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TransactionFilters value={EMPTY_FILTERS} onChange={onChange} />)

    await user.selectOptions(screen.getByLabelText('Status'), 'successful')

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, status: 'successful' })
  })

  it('applies a type change immediately', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TransactionFilters value={EMPTY_FILTERS} onChange={onChange} />)

    await user.selectOptions(screen.getByLabelText('Type'), 'debit')

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, type: 'debit' })
  })

  it('applies the search text on blur, not on every keystroke', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TransactionFilters value={EMPTY_FILTERS} onChange={onChange} />)

    const search = screen.getByLabelText('Search')
    await user.type(search, 'Ade')
    expect(onChange).not.toHaveBeenCalled()

    await user.tab()
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, q: 'Ade' })
  })

  it('applies a date range change immediately', () => {
    const onChange = vi.fn()
    render(<TransactionFilters value={EMPTY_FILTERS} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-01' } })
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, from: '2026-09-01' })

    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-09-10' } })
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, to: '2026-09-10' })
  })

  it('hides "Clear filters" until a filter is active, then resets everything on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<TransactionFilters value={EMPTY_FILTERS} onChange={onChange} />)

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()

    rerender(
      <TransactionFilters value={{ ...EMPTY_FILTERS, status: 'successful' }} onChange={onChange} />,
    )
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(onChange).toHaveBeenCalledWith(EMPTY_FILTERS)
  })
})
