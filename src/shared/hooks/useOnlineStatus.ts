import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

/**
 * Backed by TanStack Query's own `onlineManager`, not a separate `navigator.onLine`
 * listener — so "offline" here is exactly the signal that already pauses queries and
 * mutations, never a second source of truth that could disagree with it.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (callback) => onlineManager.subscribe(callback),
    () => onlineManager.isOnline(),
  )
}
