import { fireEvent, render, screen } from '@testing-library/react'

import { DateRangeField } from '../DateRangeField'

describe('DateRangeField', () => {
  it('renders one visible label for two distinctly-named date inputs', () => {
    render(
      <DateRangeField
        label="Date range"
        fromValue=""
        toValue=""
        onFromChange={vi.fn()}
        onToChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Date range')).toBeInTheDocument()
    expect(screen.getByLabelText('From date')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('To date')).toHaveAttribute('type', 'date')
  })

  it('reports the from and to dates independently', () => {
    const onFromChange = vi.fn()
    const onToChange = vi.fn()
    render(
      <DateRangeField
        label="Date range"
        fromValue=""
        toValue=""
        onFromChange={onFromChange}
        onToChange={onToChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-01' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-09-10' } })

    expect(onFromChange).toHaveBeenCalledWith('2026-09-01')
    expect(onToChange).toHaveBeenCalledWith('2026-09-10')
  })
})
