import { render, screen, within } from '@testing-library/react'
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

  // This is the original, always-shipped search trigger (the search box sits in its own
  // <form>, so Enter submits it) — the blur trigger and the clear "x" were both added later,
  // layered on top of it, not in place of it. This guards against a later change silently
  // dropping the original path.
  it('still applies the search text on Enter, unchanged from the original design', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TransactionFilters value={EMPTY_FILTERS} onChange={onChange} />)

    const search = screen.getByLabelText('Search')
    await user.type(search, 'Ngozi{Enter}')

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, q: 'Ngozi' })
  })

  it('opens a range calendar from its trigger and applies both ends of the range together as they are picked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<TransactionFilters value={EMPTY_FILTERS} onChange={onChange} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^date range/i }))
    const dialog = screen.getByRole('dialog', { name: /date range picker/i })

    const today = new Date()
    const isoDate = (day: number) =>
      `${String(today.getFullYear())}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    // The 1st of the current month and today's own date — both are always today-or-earlier,
    // unlike two arbitrary fixed days (the previous 15th/20th broke the moment this suite ran
    // after the 15th, once the calendar started disabling anything after today).
    const firstDay = 1
    const secondDay = today.getDate()

    // A single click already produces a one-day range (react-day-picker's default), so both
    // ends land on the same day here — not a partial "from only" selection.
    await user.click(within(dialog).getByText(String(firstDay)))
    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_FILTERS,
      from: isoDate(firstDay),
      to: isoDate(firstDay),
    })

    // Feed the result back in, the way the real DashboardPage (a controlled `value`) would —
    // otherwise the picker never sees the first day as already selected on the second click.
    rerender(
      <TransactionFilters
        value={{ ...EMPTY_FILTERS, from: isoDate(firstDay), to: isoDate(firstDay) }}
        onChange={onChange}
      />,
    )

    // A second click on a later day extends the existing range rather than starting a new one.
    await user.click(within(dialog).getByText(String(secondDay)))
    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_FILTERS,
      from: isoDate(firstDay),
      to: isoDate(secondDay),
    })

    // Picking a range doesn't auto-close the popover — only an outside click/Escape/re-toggling does.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^date range/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it("hides the search field's clear button until there is text, then clears just the search on click", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <TransactionFilters value={{ ...EMPTY_FILTERS, status: 'successful' }} onChange={onChange} />,
    )

    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    const search = screen.getByLabelText('Search')
    await user.type(search, 'Ade')
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(search).toHaveValue('')
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_FILTERS, status: 'successful', q: null })
  })
})
