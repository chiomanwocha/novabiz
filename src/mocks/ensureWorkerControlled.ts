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
