import { Button } from './Button'

export interface ErrorStateProps {
  message: string
  onRetry: () => void
}

/** Every fetching view's error state: a human message and a Retry button — CLAUDE.md 6.6. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-base text-text">{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}
