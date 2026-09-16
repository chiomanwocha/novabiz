import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ThemeProvider } from '../../../app/providers/ThemeProvider'
import { ThemeToggle } from '../ThemeToggle'

describe('ThemeToggle', () => {
  it('shows which mode it will switch to, and switches on click', async () => {
    const user = userEvent.setup()
    localStorage.setItem('novabiz-theme', 'light')

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    const button = screen.getByRole('button', { name: 'Dark mode' })
    await user.click(button)

    expect(screen.getByRole('button', { name: 'Light mode' })).toBeInTheDocument()
  })
})
