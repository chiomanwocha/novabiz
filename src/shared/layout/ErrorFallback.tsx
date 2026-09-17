import { Button } from '../ui/Button'

export interface ErrorFallbackProps {
  message?: string
}

/**
 * The graceful page shown when a runtime error escapes a component's render — a crashed React
 * tree can't safely "retry" in place (whatever threw could throw again immediately), so the
 * only honest recovery offered is a full reload, same as `ErrorState`'s message style elsewhere.
 */
export function ErrorFallback({ message }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-4 text-center">
      <span aria-hidden="true" className="text-4xl">
        ⚠️
      </span>
      <p className="text-lg font-semibold text-text">Something went wrong</p>
      <p role="alert" className="max-w-xs text-sm text-muted">
        {/* The heading above already says what happened — this only needs to say what fixes
            it, not repeat "something went wrong"/"didn't load correctly" a second time. */}
        {message ?? 'Reloading the page usually fixes this.'}
      </p>
      <Button
        onClick={() => {
          window.location.reload()
        }}
      >
        Reload page
      </Button>
    </div>
  )
}
