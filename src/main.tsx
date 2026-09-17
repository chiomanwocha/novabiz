import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app/App.tsx'
import './index.css'
import { loadControlsFromSearchParams } from './mocks/controls'
import { shouldForceReloadForWorkerControl } from './mocks/ensureWorkerControlled'

loadControlsFromSearchParams(window.location.search)

const RELOAD_GUARD_KEY = 'novabiz-msw-reload-guard'

/**
 * A hard reload can leave the page uncontrolled by the (still active) mock service worker,
 * which would otherwise silently send every `/api/*` fetch to Vite's real dev server instead
 * of MSW — see ensureWorkerControlled.ts. Reloading once, before the app ever mounts and
 * fires a request, fixes it; the sessionStorage guard stops a loop if the browser genuinely
 * never controls the page.
 */
async function startMockServiceWorkerIfNeeded(): Promise<boolean> {
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })

  const alreadyAttemptedReload = sessionStorage.getItem(RELOAD_GUARD_KEY) === '1'
  if (
    shouldForceReloadForWorkerControl({
      isControlled: navigator.serviceWorker.controller !== null,
      alreadyAttemptedReload,
    })
  ) {
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
    window.location.reload()
    return false
  }
  sessionStorage.removeItem(RELOAD_GUARD_KEY)
  return true
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

void startMockServiceWorkerIfNeeded().then((shouldRender) => {
  if (!shouldRender) {
    return
  }
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
