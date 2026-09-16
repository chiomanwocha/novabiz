export interface StatusAnnouncerProps {
  message: string | null
  isError?: boolean
}

/**
 * The one live status region for the whole Send Money flow — "Checking account…",
 * "Transfer sent", or a failure. Normal status is `aria-live="polite"`; failures use
 * `role="alert"` instead, per CLAUDE.md 6.4.
 */
export function StatusAnnouncer({ message, isError = false }: StatusAnnouncerProps) {
  if (isError) {
    return (
      <p role="alert" className="text-sm font-medium text-danger">
        {message}
      </p>
    )
  }
  return (
    <p aria-live="polite" className="text-sm font-medium text-muted">
      {message}
    </p>
  )
}
