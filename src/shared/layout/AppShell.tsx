import type { ReactNode } from 'react'

import { ThemeToggle } from './ThemeToggle'

export interface AppShellProps {
  children: ReactNode
}

/** The page frame every route renders inside: a header with the brand and theme toggle, then the content. */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="flex items-center justify-between border-b border-muted/20 px-4 py-3">
        <h1 className="text-lg font-semibold text-primary">NovaBiz</h1>
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-3xl p-4">{children}</main>
    </div>
  )
}
