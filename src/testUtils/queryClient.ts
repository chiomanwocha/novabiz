import { QueryClient } from '@tanstack/react-query'

/** No retries — a simulated failure should resolve in a test immediately, not wait out the app's real backoff schedule. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}
