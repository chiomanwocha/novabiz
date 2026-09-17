import { Moon, Sun } from 'lucide-react'

import { useTheme } from '../../app/providers/ThemeProvider'

/**
 * Icon-only toggle — an outline sun/moon, not a filled/coloured glyph, so it reads as a native
 * app control rather than a decorative pill. Light-on-navy on mobile (the header is navy
 * there, matching the tab bar) but muted-on-white on desktop (the header stays light there,
 * since the sidebar already carries the navy) — the one place in the app this component is
 * used, so the colours live here rather than as a prop. The state is still never colour-alone:
 * it's carried by aria-label (announced to screen readers and matched by tests via the
 * button's accessible name), same contract as before, just with the visible text label
 * removed.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Light mode' : 'Dark mode'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:text-muted md:hover:bg-surface-hover md:hover:text-text"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      ) : (
        <Moon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      )}
    </button>
  )
}
