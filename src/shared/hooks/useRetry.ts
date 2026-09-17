import { useCallback } from 'react'

import { requiresPageReloadToRetry } from '../../api/errors'

interface RetryableQuery {
  error: unknown
  refetch: () => unknown
}

/**
 * Every ErrorState's Retry button needs to decide between a normal query refetch and a full
 * page reload — the latter only for the one error kind (`invalidResponse`) that a refetch can
 * never fix on its own, see api/errors.ts's requiresPageReloadToRetry.
 */
export function useRetry(query: RetryableQuery): () => void {
  return useCallback(() => {
    if (requiresPageReloadToRetry(query.error)) {
      window.location.reload()
      return
    }
    void query.refetch()
  }, [query])
}
