import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DateRangeField } from '../DateRangeField'

describe('DateRangeField', () => {
  it('renders a labelled trigger showing "All dates" when nothing is selected', () => {
    render(<DateRangeField label="Date range" fromValue="" toValue="" onRangeChange={vi.fn()} />)

    const trigger = screen.getByRole('button', { name: /date range all dates/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('summarises an already-selected range on the trigger without opening the picker', () => {
    render(
      <DateRangeField
        label="Date range"
        fromValue="2026-09-01"
        toValue="2026-09-10"
        onRangeChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: /1 sept.*10 sept 2026/i })).toBeInTheDocument()
  })

  it('opens the calendar on click and reports both ends of the picked range together', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    render(
      <DateRangeField label="Date range" fromValue="" toValue="" onRangeChange={onRangeChange} />,
    )

    await user.click(screen.getByRole('button', { name: /^date range/i }))
    const dialog = screen.getByRole('dialog', { name: 'Date range picker' })

    const today = new Date()
    const isoDate = (day: number) =>
      `${String(today.getFullYear())}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Day 1 specifically (not, say, the 12th): the calendar now disables anything after
    // today (see the "caps the range at today" test below), and the 1st of the current
    // month is the one day of any month that's never in the future relative to "today".
    await user.click(within(dialog).getByText('1'))
    expect(onRangeChange).toHaveBeenLastCalledWith({ from: isoDate(1), to: isoDate(1) })
  })

  it('caps the range at today — a future day in the current month is disabled', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    render(
      <DateRangeField label="Date range" fromValue="" toValue="" onRangeChange={onRangeChange} />,
    )

    await user.click(screen.getByRole('button', { name: /^date range/i }))
    const dialog = screen.getByRole('dialog', { name: 'Date range picker' })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    // Only meaningful if tomorrow is still in the same displayed month — skip the assertion
    // near a month boundary rather than assert on a day that isn't rendered at all.
    if (tomorrow.getMonth() === new Date().getMonth()) {
      const futureDayCell = within(dialog).getByText(String(tomorrow.getDate()))
      expect(futureDayCell.closest('button')).toBeDisabled()
    }
  })

  it('shows a clear button once a range is picked, which resets to "All dates"', async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    const { rerender } = render(
      <DateRangeField label="Date range" fromValue="" toValue="" onRangeChange={onRangeChange} />,
    )

    expect(screen.queryByRole('button', { name: 'Clear date range' })).not.toBeInTheDocument()

    rerender(
      <DateRangeField
        label="Date range"
        fromValue="2026-09-01"
        toValue="2026-09-10"
        onRangeChange={onRangeChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Clear date range' }))
    expect(onRangeChange).toHaveBeenCalledWith({ from: '', to: '' })
  })

  it('closes the calendar on Escape', async () => {
    const user = userEvent.setup()
    render(<DateRangeField label="Date range" fromValue="" toValue="" onRangeChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^date range/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes the calendar on an outside click', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button type="button">Outside</button>
        <DateRangeField label="Date range" fromValue="" toValue="" onRangeChange={vi.fn()} />
      </div>,
    )

    await user.click(screen.getByRole('button', { name: /^date range/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
