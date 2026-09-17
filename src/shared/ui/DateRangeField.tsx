import { Calendar, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'

export interface DateRangeFieldProps {
  label: string
  fromValue: string
  toValue: string
  /** Called once per selection with both ends together — see handleSelect for why this can't be two separate onFromChange/onToChange callbacks. */
  onRangeChange: (range: { from: string; to: string }) => void
}

/** `YYYY-MM-DD` (the native `<input type="date">` format this field's callers already store) → a local Date, or undefined for an empty string. Parsed with an explicit local time-of-day rather than passed straight to `new Date(string)`, which treats a bare date as UTC midnight and can shift the displayed day by one depending on the browser's timezone. */
function parseIsoDate(value: string): Date | undefined {
  if (!value) {
    return undefined
  }
  const [year, month, day] = value.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) {
    return undefined
  }
  return new Date(year, month - 1, day)
}

function toIsoDate(date: Date): string {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' })
const FULL_DATE_FORMAT = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function summarise(range: DateRange | undefined): string {
  if (!range?.from && !range?.to) {
    return 'All dates'
  }
  if (range.from && !range.to) {
    return `From ${FULL_DATE_FORMAT.format(range.from)}`
  }
  if (!range.from && range.to) {
    return `Until ${FULL_DATE_FORMAT.format(range.to)}`
  }
  // Both present.
  return `${SHORT_DATE_FORMAT.format(range.from)} – ${FULL_DATE_FORMAT.format(range.to)}`
}

/**
 * A single trigger button showing the selected range (or "All dates"), opening a popover
 * calendar in range-select mode — replaces the earlier two-separate-native-date-inputs
 * layout, which read as two unrelated fields rather than one range. Built on react-day-picker
 * for the calendar grid itself (correct week/month layout, keyboard navigation, a11y roles
 * all handled by the library) with only its colour scheme re-themed to the brand tokens (see
 * `.novabiz-rdp` in theme/tokens.css) rather than every part re-styled — its own stylesheet
 * already gets the fiddly grid spacing right. Closes on Escape or an outside click — not on
 * picking a "complete" range, because a single click already produces one (react-day-picker's
 * default range behaviour treats one click as a one-day range, `from === to`), which would make
 * the popover disappear before a second click could ever extend it into a real multi-day range.
 */
export function DateRangeField({ label, fromValue, toValue, onRangeChange }: DateRangeFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const valueId = useId()

  const selected: DateRange = { from: parseIsoDate(fromValue), to: parseIsoDate(toValue) }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // One call, both ends together — not two separate onFromChange/onToChange calls. A single
  // click already changes both ends at once here (react-day-picker starts a range as
  // `{ from: date, to: date }`, not `{ from: date, to: undefined }`), and two independent
  // calls that each spread the parent's *current* `value` prop would race: whichever call
  // happens second would spread a `value` that doesn't yet reflect the first call's change
  // (no re-render has happened between them), silently stomping it back to null.
  function handleSelect(range: DateRange | undefined): void {
    onRangeChange({
      from: range?.from ? toIsoDate(range.from) : '',
      to: range?.to ? toIsoDate(range.to) : '',
    })
  }

  const hasSelection = Boolean(selected.from ?? selected.to)

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <span id={labelId} className="text-sm font-medium text-text">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-labelledby={`${labelId} ${valueId}`}
          onClick={() => {
            setIsOpen((open) => !open)
          }}
          className={`flex min-h-11 w-full items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-base text-text transition-all duration-150 hover:border-primary/30 hover:bg-surface-hover focus-visible:border-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 ${hasSelection ? 'pr-10' : ''}`}
        >
          <Calendar aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.8} />
          <span id={valueId} className="whitespace-nowrap">
            {summarise(selected)}
          </span>
        </button>
        {hasSelection && (
          <button
            type="button"
            onClick={() => {
              onRangeChange({ from: '', to: '' })
            }}
            aria-label={`Clear ${label.toLowerCase()}`}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition hover:text-text"
          >
            <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </button>
        )}
      </div>
      {isOpen && (
        <div
          role="dialog"
          aria-label={`${label} picker`}
          // right-0 (not left-0): this field sits at the right edge of the filters row on
          // desktop, so a popover anchored to its left edge could open off-screen.
          // max-w/overflow-x-auto is a safety net for 360px screens rather than the primary
          // fix (text-sm below already shrinks the calendar enough to fit without it in
          // practice).
          className="absolute top-full right-0 z-20 mt-2 max-w-[calc(100vw-2rem)] overflow-x-auto rounded-xl border border-border bg-surface p-2 text-sm shadow-lg"
        >
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected.from ?? selected.to}
            disabled={{ after: new Date() }}
            className="novabiz-rdp"
          />
        </div>
      )}
    </div>
  )
}
