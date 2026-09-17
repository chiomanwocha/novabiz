import { useTheme } from '../../app/providers/ThemeProvider'

function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
