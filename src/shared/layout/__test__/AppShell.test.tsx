import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { ThemeProvider } from '../../../app/providers/ThemeProvider'
import { AppShell } from '../AppShell'

function renderShell(children: ReactNode) {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AppShell>{children}</AppShell>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('renders the brand, a theme toggle, primary nav links, and the page content', () => {
    renderShell(<p>Dashboard content</p>)

    // Rendered twice — once in the mobile header, once at the top of the desktop sidebar —
    // and toggled with CSS rather than JS, so both exist in the DOM regardless of viewport.
    expect(screen.getAllByText('NovaBiz').length).toBeGreaterThan(0)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Send Money' })).toBeInTheDocument()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })

  it("marks the current route's nav link with aria-current", () => {
    render(
      <MemoryRouter initialEntries={['/send']}>
        <ThemeProvider>
          <AppShell>
            <p>Send money content</p>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Send Money' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })
})
