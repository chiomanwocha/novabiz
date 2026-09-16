export type ApiErrorKind = 'network' | 'timeout' | 'http'

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

/** Network failures, timeouts, and 5xx responses are worth retrying. A 4xx never is. */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false
  }
  if (error.kind === 'network' || error.kind === 'timeout') {
    return true
  }
  return error.status !== null && error.status >= 500
}
