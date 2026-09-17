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
    <details className="fixed bottom-3 right-3 z-50 w-64 rounded-xl border border-border bg-surface p-3 text-sm shadow-lg">
      <summary className="cursor-pointer font-semibold text-text">Mock controls</summary>
      <div className="mt-3 flex flex-col gap-3">
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
