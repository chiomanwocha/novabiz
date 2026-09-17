export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalidResponse'

interface ApiErrorOptions {
  kind: ApiErrorKind
  /** HTTP status for an `http` error, `null` for `network`/`timeout`. */
  status: number | null
  message: string
}

/** Thrown by api/client.ts for every failure: a non-2xx response, a network failure, or a timeout. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null

  constructor({ kind, status, message }: ApiErrorOptions) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
  }
}

/**
 * Network failures, timeouts, and 5xx responses are worth retrying. A 4xx never is.
 * `invalidResponse` is deliberately excluded, not an oversight: it means the service worker
 * has lost control of the page (see requiresPageReloadToRetry below), and a query retry just
 * re-sends the same request into the same uncontrolled page — only a real reload
 * (`mocks/ensureWorkerControlled.ts`) can actually fix that.
 */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false
  }
  if (error.kind === 'network' || error.kind === 'timeout') {
    return true
  }
  return error.status !== null && error.status >= 500
}

/**
 * A 2xx response whose body isn't the expected JSON envelope only ever happens in dev when
 * a request skipped the mock service worker entirely (see mocks/ensureWorkerControlled.ts) —
 * every real handler always returns valid JSON. A query refetch re-sends the exact same
 * request and gets the exact same result, so it can never fix this; only a real page reload
 * (which re-establishes the worker's control of the page) can.
 */
export function requiresPageReloadToRetry(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'invalidResponse'
}
