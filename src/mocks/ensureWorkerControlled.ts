/**
 * Shared between main.tsx (startup) and api/client.ts (reactive recovery mid-session — a
 * long-idle tab can lose worker control the same way a hard reload does) so both paths use
 * the exact same one-shot guard and can't fight over two different keys.
 */
export const MSW_RELOAD_GUARD_KEY = 'novabiz-msw-reload-guard'

/**
 * A hard reload leaves the page uncontrolled by any service worker, even when one is
 * registered and active — Chrome does this deliberately for the reloaded navigation.
 * Every `/api/*` fetch from an uncontrolled page silently skips MSW and falls through to
 * Vite's own dev server, which replies with its SPA `index.html` fallback at HTTP 200 —
 * a real, successful-looking response that isn't real API data. Only a subsequent normal
 * reload restores control, which is why "refresh the app" was the only thing that fixed it.
 *
 * `alreadyAttemptedReload` (backed by sessionStorage in main.tsx, not this pure function)
 * stops an infinite reload loop if the browser genuinely never controls the page.
 */
export function shouldForceReloadForWorkerControl(params: {
  isControlled: boolean
  alreadyAttemptedReload: boolean
}): boolean {
  return !params.isControlled && !params.alreadyAttemptedReload
}
