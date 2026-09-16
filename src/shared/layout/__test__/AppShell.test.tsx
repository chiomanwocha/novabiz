import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import { ThemeProvider } from '../../../app/providers/ThemeProvider'
import { AppShell } from '../AppShell'

function renderShell(children: ReactNode) {
  return render(
    <ThemeProvider>
      <AppShell>{children}</AppShell>
    </ThemeProvider>,
  )
}

describe('AppShell', () => {
  it('renders the brand heading, a theme toggle, and the page content', () => {
    renderShell(<p>Dashboard content</p>)

    expect(screen.getByRole('heading', { name: 'NovaBiz' })).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Dashboard content')).toBeInTheDocument()
  })
})
