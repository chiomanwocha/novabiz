import { useOnlineStatus } from '../hooks/useOnlineStatus'

/**
 * A persistent banner when the browser reports itself offline — CLAUDE.md 6.6. `role="status"`
 * is an implicit `aria-live="polite"` region, so the message is announced the moment it
 * appears without needing a separate live region. `text-on-accent` (not `text-white`) on the
 * warning background for the same reason `Button`'s gold variant uses it — `--color-warning`
 * shifts lighter in dark mode, and a fixed dark text colour is what stays readable in both.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div
      role="status"
      className="bg-warning px-4 py-2 text-center text-sm font-medium text-on-accent"
    >
      You&apos;re offline — we&apos;ll retry when you&apos;re back. No data? Dial *894#.
    </div>
  )
}
