import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ThemeProvider, useTheme } from '../ThemeProvider'

const STORAGE_KEY = 'novabiz-theme'

function ToggleButton() {
  const { toggleTheme } = useTheme()
  return (
    <button type="button" onClick={toggleTheme}>
      Toggle theme
    </button>
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('ThemeProvider', () => {
  it('defaults to the system preference when nothing is stored', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as typeof window.matchMedia

    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    )

    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('prefers a stored theme over the system preference', () => {
    localStorage.setItem(STORAGE_KEY, 'light')
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as typeof window.matchMedia

    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    )

    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('toggles the theme and persists the choice to localStorage', async () => {
    const user = userEvent.setup()
    localStorage.setItem(STORAGE_KEY, 'light')

    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it('throws a clear error when useTheme is used outside a ThemeProvider', () => {
    function Broken() {
      useTheme()
      return null
    }

    expect(() => render(<Broken />)).toThrow('useTheme must be used within a ThemeProvider')
  })
})
