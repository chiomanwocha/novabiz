import { useOnlineStatus } from '../hooks/useOnlineStatus'

/**
 * A persistent banner when the browser reports itself offline — CLAUDE.md 6.6. `role="status"`
 * is an implicit `aria-live="polite"` region, so the message is announced the moment it
 * appears without needing a separate live region. `sticky top-16` pins it directly under
 * AppShell's own `sticky top-0 h-16` header, the same way the sidebar nav stays put, rather
 * than scrolling away with the page content below it. `text-on-warning` (not a fixed colour)
 * because, unlike `--color-accent`, `--color-warning` itself changes brightness between
 * themes — dark navy text stops being readable once the background gets brighter in dark
 * mode, so which text colour is readable has to flip too (see the token's own comment in
 * theme/tokens.css for the measured contrast either side of that).
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div
      role="status"
      className="sticky top-16 z-30 bg-warning px-4 py-2 text-center text-sm font-medium text-on-warning"
    >
      You&apos;re offline — we&apos;ll retry when you&apos;re back. No data? Dial *894#.
    </div>
  )
}
