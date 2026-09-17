import { Settings } from 'lucide-react'
import { useId, useState } from 'react'

import { getControls, setControls, type MockControls } from '../../mocks/controls'

const LATENCY_OPTIONS = [
  { value: 'default', label: 'Default (400–1200ms)' },
  { value: '0', label: 'Instant (0ms)' },
  { value: '3000', label: 'Slow (3000ms)' },
] as const

/**
 * A small always-visible panel for toggling the mock server's latency, failure rate, and
 * timeout mode live — the same controls as the `?latency=`/`?failRate=`/`?timeoutMode=`
 * URL params (CLAUDE.md 6.2), made demoable without editing the URL. `mocks/controls.ts` is
 * a plain mutable module with no pub-sub of its own, so this is the only UI that ever
 * changes it — local state here just mirrors it for display, it isn't a second source of
 * truth another component could read stale values from.
 *
 * Collapsed to a single icon button, not the full panel — the panel's own width used to sit
 * directly on top of the mobile bottom tab bar (PrimaryNav), blocking the Send Money link.
 * `bottom-20` (mobile only, where that tab bar exists) clears it; `md:bottom-3` matches the
 * old corner position once the nav becomes a side rail and there's nothing left to cover.
 */
export function DevControls() {
  const [controls, setLocalControls] = useState<MockControls>(getControls)
  const latencyId = useId()
  const failRateId = useId()
  const timeoutId = useId()

  function update(patch: Partial<MockControls>): void {
    setControls(patch)
    setLocalControls(getControls())
  }

  return (
    <details className="fixed bottom-20 right-3 z-50 md:bottom-3">
      <summary
        aria-label="Mock controls"
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-border bg-surface text-muted shadow-lg transition hover:text-text [&::-webkit-details-marker]:hidden"
      >
        <Settings aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
      </summary>
      <div className="mt-3 flex w-64 flex-col gap-3 rounded-xl border border-border bg-surface p-3 text-sm shadow-lg">
        <label htmlFor={latencyId} className="flex flex-col gap-1 text-text">
          Latency
          <select
            id={latencyId}
            className="rounded-lg border border-border bg-surface px-2 py-1.5"
            value={controls.fixedLatencyMs === null ? 'default' : String(controls.fixedLatencyMs)}
            onChange={(event) => {
              const { value } = event.target
              update({ fixedLatencyMs: value === 'default' ? null : Number(value) })
            }}
          >
            {LATENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={failRateId} className="flex flex-col gap-1 text-text">
          Failure rate: {Math.round(controls.failRate * 100)}%
          <input
            id={failRateId}
            type="range"
            min={0}
            max={1}
            step={0.25}
            value={controls.failRate}
            onChange={(event) => {
              update({ failRate: Number(event.target.value) })
            }}
          />
        </label>
        <label htmlFor={timeoutId} className="flex items-center gap-2 text-text">
          <input
            id={timeoutId}
            type="checkbox"
            checked={controls.timeoutMode}
            onChange={(event) => {
              update({ timeoutMode: event.target.checked })
            }}
          />
          Timeout mode
        </label>
      </div>
    </details>
  )
}
