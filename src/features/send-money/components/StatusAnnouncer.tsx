import { VisuallyHidden } from '../../../shared/ui/VisuallyHidden'

export interface StatusAnnouncerProps {
  message: string | null
  isError?: boolean
  /**
   * The success view already shows "Transfer sent!" as its own big heading, right above
   * this announcer — without this, a sighted user reads "Transfer sent!" immediately
   * followed by "Transfer sent" again, since this region's whole job is to also be
   * announced to screen readers. Visually hiding it here keeps the screen-reader
   * announcement (CLAUDE.md 6.4) without the visible duplicate; every other status
   * ("Checking account…", "Sending…", a failure) still needs to stay visible, since
   * sighted users rely on it too, so this only applies where the caller opts in.
   */
  visuallyHidden?: boolean
}

/**
 * The one live status region for the whole Send Money flow — "Checking account…",
 * "Transfer sent", or a failure. Normal status is `aria-live="polite"`; failures use
 * `role="alert"` instead, per CLAUDE.md 6.4.
 */
export function StatusAnnouncer({
  message,
  isError = false,
  visuallyHidden = false,
}: StatusAnnouncerProps) {
  const content = isError ? (
    <p role="alert" className="text-sm font-medium text-danger">
      {message}
    </p>
  ) : (
    <p aria-live="polite" className="text-sm font-medium text-muted">
      {message}
    </p>
  )
  return visuallyHidden ? <VisuallyHidden>{content}</VisuallyHidden> : content
}
