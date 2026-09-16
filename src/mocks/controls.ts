import { DEFAULT_LATENCY_MAX_MS, DEFAULT_LATENCY_MIN_MS } from '../config/constants'

/**
 * In-memory-only knobs for the mock server: latency, random failure rate, and
 * "timeout mode" (the server applies the change but replies after the client's
 * timeout, simulating "the money moved, the response got lost"). Set from URL params
 * on load and from the DevControls panel — never persisted to localStorage.
 */
export interface MockControls {
  /** Fixed latency override in ms, or `null` to use the default random 400-1200ms range. */
  fixedLatencyMs: number | null
  /** 0-1: probability a handler responds with a simulated failure. */
  failRate: number
  timeoutMode: boolean
}

let controls: MockControls = {
  fixedLatencyMs: null,
  failRate: 0,
  timeoutMode: false,
}

export function getControls(): MockControls {
  return controls
}

export function setControls(patch: Partial<MockControls>): void {
  controls = { ...controls, ...patch }
}

/** Reads `?latency=`, `?failRate=`, `?timeoutMode=` from the page URL, e.g. `/?failRate=1`. */
export function loadControlsFromSearchParams(search: string): void {
  const params = new URLSearchParams(search)
  const patch: Partial<MockControls> = {}

  const latency = params.get('latency')
  if (latency !== null && !Number.isNaN(Number(latency))) {
    patch.fixedLatencyMs = Number(latency)
  }

  const failRate = params.get('failRate')
  if (failRate !== null && !Number.isNaN(Number(failRate))) {
    patch.failRate = Math.min(1, Math.max(0, Number(failRate)))
  }

  const timeoutMode = params.get('timeoutMode')
  if (timeoutMode !== null) {
    patch.timeoutMode = timeoutMode === '1' || timeoutMode === 'true'
  }

  setControls(patch)
}

/** Milliseconds to delay a response by, honoring a fixed override or falling back to a random range. */
export function randomLatencyMs(): number {
  if (controls.fixedLatencyMs !== null) {
    return controls.fixedLatencyMs
  }
  return Math.floor(
    Math.random() * (DEFAULT_LATENCY_MAX_MS - DEFAULT_LATENCY_MIN_MS + 1) + DEFAULT_LATENCY_MIN_MS,
  )
}

/** Rolls against the current failRate. */
export function shouldSimulateFailure(): boolean {
  return Math.random() < controls.failRate
}
