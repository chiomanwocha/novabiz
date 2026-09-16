import { QueryClient } from '@tanstack/react-query'

import { isRetryable } from '../api/errors'

/** Retry up to 3 times, and only for errors worth retrying — CLAUDE.md 6.6. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return failureCount < 3 && isRetryable(error)
}

/** 1s, 2s, 4s, 8s... capped at 8s. */
export function retryDelayMs(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, 8000)
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      retryDelay: retryDelayMs,
    },
  },
})
