import { useId } from 'react'

export interface DateRangeFieldProps {
  label: string
  fromValue: string
  toValue: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-muted">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3.5 9.5h17M8 3v3.5M16 3v3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * One merged control for a date range, rather than two separate "From"/"To" fields sitting
 * apart from each other — still two native date inputs underneath (full keyboard/screen-reader
 * support, light on low-end phones), just visually and structurally presented as a single
 * range picker. Each input keeps its own accessible name ("From date"/"To date") since they're
 * two distinct values, even though there's one visible label for the pair.
 */
export function DateRangeField({
  label,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
}: DateRangeFieldProps) {
  const labelId = useId()

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium text-text">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 transition-all duration-150 hover:border-primary/30 hover:bg-surface-hover focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/20"
      >
        <CalendarIcon />
        <input
          type="date"
          aria-label="From date"
          value={fromValue}
          onChange={(event) => {
            onFromChange(event.target.value)
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none"
        />
        <span aria-hidden="true" className="text-muted">
          –
        </span>
        <input
          type="date"
          aria-label="To date"
          value={toValue}
          onChange={(event) => {
            onToChange(event.target.value)
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none"
        />
      </div>
    </div>
  )
}
