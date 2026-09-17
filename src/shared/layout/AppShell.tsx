import type { ReactNode } from 'react'

import { BrandMark } from './BrandMark'
import { PrimaryNav } from './PrimaryNav'
import { ThemeToggle } from './ThemeToggle'

export interface AppShellProps {
  children: ReactNode
}

/**
 * The page frame every route renders inside. From md up this is a flex row: PrimaryNav (the
 * navy sidebar, full viewport height) beside a content column that owns its own header — that
 * split, not a fixed-position sidebar with padding offsets, is what makes the sidebar read as
 * navy from the very top of the page instead of stopping below a full-width white header. The
 * header is navy on mobile only, matching the tab bar, so the page doesn't read as mostly white
 * with one navy stripe at the very bottom — the desktop header stays light, since the sidebar
 * itself already carries the navy there. On mobile there's no row — PrimaryNav renders as a
 * fixed bottom tab bar instead, and the header carries the brand mark (inverted, since it's on
 * navy on mobile) since there's no sidebar to hold it there.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg text-text md:flex">
      <PrimaryNav />
      <div className="flex min-h-screen flex-1 flex-col md:min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-end bg-brand-navy px-4 md:border-b md:border-border md:bg-surface md:px-6">
          <div className="mr-auto md:hidden">
            <BrandMark inverted />
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-3.5 pb-24 pt-4 sm:px-4 md:px-6 md:pb-10 md:pt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
