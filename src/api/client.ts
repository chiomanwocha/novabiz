import { REQUEST_TIMEOUT_MS } from '../config/constants'
import {
  MSW_RELOAD_GUARD_KEY,
  shouldForceReloadForWorkerControl,
} from '../mocks/ensureWorkerControlled'

import { ApiError } from './errors'

interface Envelope<T> {
  code: number
  message: string
  data: T
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST'
  body?: unknown
  headers?: Record<string, string>
}

/**
 * The one place in the app that calls fetch. Applies the request timeout, unwraps the
 * `{ code, message, data }` envelope every mock endpoint returns, and turns a non-2xx
 * response, a network failure, or a timeout into a typed ApiError — so callers (and
 * TanStack Query's onError) only ever deal with one error shape, whatever went wrong.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers } = options

  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    // Checked by `.name`, not `instanceof DOMException`: under jsdom (used in tests),
    // the timeout error is constructed against Node's own DOMException global, which
    // is a different realm from jsdom's — `instanceof` fails across that boundary even
    // though the error really is a DOMException named 'TimeoutError'.
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new ApiError({ kind: 'timeout', status: null, message: 'The request timed out.' })
    }
    throw new ApiError({ kind: 'network', status: null, message: 'A network error occurred.' })
  }

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null

  if (!response.ok) {
    throw new ApiError({
      kind: 'http',
      status: response.status,
      message: envelope?.message ?? 'Something went wrong.',
    })
  }

  if (!envelope) {
    // A 2xx response that isn't valid JSON only happens, in this app, when a request never
    // reached a mock handler at all (every handler always returns the JSON envelope) — see
    // requiresPageReloadToRetry and mocks/ensureWorkerControlled.ts for why. A long-idle tab
    // can lose the worker's control the same way a hard reload does, so before surfacing the
    // dead-end error, try the same one-shot recovery main.tsx does at startup: if the page is
    // genuinely uncontrolled and hasn't already tried this, reload silently instead of ever
    // showing broken UI. `serviceWorker == null` (API unsupported) is treated as "controlled"
    // — there's nothing a reload could fix, so fall through to the real error instead of
    // reloading forever.
    // Cast to a genuinely optional type: the DOM lib declares `serviceWorker` as always
    // present, but jsdom (and unsupporting browsers) really do leave it undefined at runtime.
    const serviceWorkerContainer = navigator.serviceWorker as ServiceWorkerContainer | undefined
    const isControlled = serviceWorkerContainer?.controller !== null
    const alreadyAttemptedReload = sessionStorage.getItem(MSW_RELOAD_GUARD_KEY) === '1'
    if (shouldForceReloadForWorkerControl({ isControlled, alreadyAttemptedReload })) {
      sessionStorage.setItem(MSW_RELOAD_GUARD_KEY, '1')
      window.location.reload()
      // eslint-disable-next-line @typescript-eslint/no-empty-function -- never resolves: the page is about to navigate away
      return new Promise<T>(() => {})
    }

    throw new ApiError({
      kind: 'invalidResponse',
      status: response.status,
      // Calm, non-technical wording (CLAUDE.md 6.6): pairs with the Retry button every
      // ErrorState already shows, so this doesn't need to spell out "reload the page"
      // itself — the action is right there. "Didn't load correctly" read as more alarming
      // than the situation actually is for something this recoverable.
      message: "We couldn't load this right now. Please try again.",
    })
  }

  // A normal, successful request proves the page is genuinely controlled again — clear the
  // guard so a *future* control lapse gets its own fresh silent-reload attempt instead of
  // being permanently blocked by a lapse from earlier in the same tab session. Without this,
  // the guard (set the moment any reload is attempted, cleared only by main.tsx at the next
  // full page boot) stays '1' for the rest of the session after the first recovery — meaning
  // every control lapse *after* the first one in a session would skip straight to showing the
  // error, even though each one is just as recoverable as the first.
  if (sessionStorage.getItem(MSW_RELOAD_GUARD_KEY) === '1') {
    sessionStorage.removeItem(MSW_RELOAD_GUARD_KEY)
  }

  return envelope.data
}
