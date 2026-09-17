import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  /** A small decorative leading icon, e.g. a search or calendar glyph. Never the only cue. */
  icon?: ReactNode
}

/**
 * A labelled text input with an optional hint and an error linked via aria-describedby/aria-invalid.
 * Hover and focus are deliberately soft — a light tint and a glow-style ring rather than a hard
 * border-darken/outline jump — while still keeping a visible, WCAG AA-compliant focus indicator.
 */
export function Input({ label, error, hint, icon, id, className, ...rest }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted"
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`min-h-11 w-full rounded-lg border bg-surface px-3.5 text-base text-text transition-all duration-150 hover:bg-surface-hover focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 ${icon ? 'pl-9' : ''} ${error ? 'border-danger' : 'border-border hover:border-primary/30'} ${className ?? ''}`}
          {...rest}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
