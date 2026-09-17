import { useId, type SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: readonly SelectOption[]
  placeholder?: string
  error?: string
  hint?: string
  /**
   * Whether the placeholder can be re-selected once a real option is chosen. Most selects
   * (e.g. "choose a bank") want the placeholder disabled — it's not a real choice, it's the
   * absence of one, and the form shouldn't let you go back to it. A filter like "Status" is
   * the opposite: its placeholder ("All statuses") IS a real, resettable choice, so it must
   * stay selectable or there's no way to get back to it from the dropdown itself.
   */
  placeholderSelectable?: boolean
}

/** A labelled select with the same error/hint wiring as Input, for consistent form fields. */
export function Select({
  label,
  options,
  placeholder,
  placeholderSelectable = false,
  error,
  hint,
  id,
  className,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const hintId = hint ? `${selectId}-hint` : undefined
  const errorId = error ? `${selectId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-text">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-11 rounded-lg border bg-surface px-3.5 text-base text-text transition-all duration-150 hover:border-primary/30 hover:bg-surface-hover focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 ${error ? 'border-danger' : 'border-border'} ${className ?? ''}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled={!placeholderSelectable}>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
