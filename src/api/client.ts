import { REQUEST_TIMEOUT_MS } from '../config/constants'

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
    throw new ApiError({
      kind: 'http',
      status: response.status,
      message: 'The server sent back something unexpected.',
    })
  }

  return envelope.data
}
