import { delay, http, HttpResponse } from 'msw'

import { setControls } from '../../mocks/controls'
import { setupMockServer } from '../../mocks/handlers/__test__/setupMockServer'
import { server } from '../../mocks/node'
import { apiRequest } from '../client'

// The real REQUEST_TIMEOUT_MS is 10s — mocked small here so the timeout test doesn't
// make the suite slow. vi.mock is hoisted above every other statement in this file, so
// the factory can't reference any outer variable (same pattern as the handler tests).
vi.mock('../../config/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/constants')>()),
  REQUEST_TIMEOUT_MS: 400,
}))

const mockTimeoutMs = 400

setupMockServer()

beforeEach(() => {
  // The mocked REQUEST_TIMEOUT_MS (400ms) is shorter than the mock server's default
  // random latency (400-1200ms) — without this, every request in this file would time
  // out for real before the handler ever responds.
  setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
})

describe('apiRequest', () => {
  it('returns the unwrapped data for a successful response', async () => {
    const data = await apiRequest<{ name: string }>('/api/merchant')
    expect(data.name).toBeTruthy()
  })

  it('throws a typed http ApiError carrying the server status and message for a non-2xx response', async () => {
    server.use(
      http.get('/api/merchant', () =>
        HttpResponse.json({ code: 422, message: 'Nope', data: null }, { status: 422 }),
      ),
    )

    await expect(apiRequest('/api/merchant')).rejects.toMatchObject({
      kind: 'http',
      status: 422,
      message: 'Nope',
    })
  })

  it('throws a network ApiError when the request fails outright', async () => {
    server.use(http.get('/api/merchant', () => HttpResponse.error()))

    await expect(apiRequest('/api/merchant')).rejects.toMatchObject({
      kind: 'network',
      status: null,
    })
  })

  it('throws a timeout ApiError when the response is slower than the request timeout', async () => {
    server.use(
      http.get('/api/merchant', async () => {
        await delay(mockTimeoutMs * 3)
        return HttpResponse.json({ code: 200, message: 'OK', data: {} })
      }),
    )

    await expect(apiRequest('/api/merchant')).rejects.toMatchObject({
      kind: 'timeout',
      status: null,
    })
  })

  it('throws an invalidResponse ApiError for a 2xx response that is not valid JSON', async () => {
    // Reproduces what an unintercepted request actually gets back in dev: Vite's real dev
    // server replies with its SPA index.html fallback at 200, not JSON — see
    // mocks/ensureWorkerControlled.ts for why that happens and how it's prevented.
    server.use(
      http.get(
        '/api/merchant',
        () => new HttpResponse('<!doctype html><html></html>', { status: 200 }),
      ),
    )

    await expect(apiRequest('/api/merchant')).rejects.toMatchObject({
      kind: 'invalidResponse',
      status: 200,
    })
  })

  it('reloads the page instead of throwing when a 2xx-but-not-JSON response means the tab lost service worker control', async () => {
    // Simulates the real-world case this is for: a long-idle tab whose worker control lapsed,
    // caught reactively mid-session instead of only at startup (main.tsx) — see
    // mocks/ensureWorkerControlled.ts.
    sessionStorage.removeItem('novabiz-msw-reload-guard')
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: null },
      configurable: true,
    })
    const originalLocation = window.location
    const reloadSpy = vi.fn()
    // jsdom's Location.prototype.reload isn't configurable, so neither vi.spyOn nor
    // redefining it in place works — replace the whole `window.location` instead, keeping
    // `href` (fetch resolves relative URLs against it) so requests still go through.
    Object.defineProperty(window, 'location', {
      value: { href: originalLocation.href, reload: reloadSpy },
      configurable: true,
    })

    server.use(
      http.get(
        '/api/merchant',
        () => new HttpResponse('<!doctype html><html></html>', { status: 200 }),
      ),
    )

    const pending = apiRequest('/api/merchant')
    // The recovery path never resolves its promise (the page is about to navigate away), so
    // race it against a short delay instead of awaiting it directly.
    await Promise.race([pending, new Promise((resolve) => setTimeout(resolve, 50))])

    expect(reloadSpy).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem('novabiz-msw-reload-guard')).toBe('1')

    Object.defineProperty(window, 'location', { value: originalLocation, configurable: true })
    Reflect.deleteProperty(navigator, 'serviceWorker')
  })

  // Regression case: the error card kept reappearing after switching tabs and coming back
  // once — traced to the reload guard only ever being cleared by main.tsx at the next full
  // page boot, never by a normal successful request mid-session. That meant one lapse early
  // in a tab's life permanently blocked the silent self-heal for every *later* lapse in that
  // same tab, so every one after the first surfaced the real error card instead.
  it('clears the reload guard again once a normal request succeeds, so a later lapse gets its own fresh silent-reload attempt', async () => {
    sessionStorage.setItem('novabiz-msw-reload-guard', '1')

    await apiRequest('/api/merchant')

    expect(sessionStorage.getItem('novabiz-msw-reload-guard')).toBeNull()
  })

  it('sends a JSON body and the given headers on a POST', async () => {
    server.use(
      http.post('/api/name-enquiry', async ({ request }) => {
        expect(request.headers.get('Content-Type')).toBe('application/json')
        expect(request.headers.get('Idempotency-Key')).toBe('test-key')
        const body = (await request.json()) as { accountNumber: string }
        expect(body.accountNumber).toBe('0102030400')
        return HttpResponse.json({ code: 200, message: 'OK', data: { ok: true } })
      }),
    )

    const data = await apiRequest<{ ok: boolean }>('/api/name-enquiry', {
      method: 'POST',
      body: { accountNumber: '0102030400' },
      headers: { 'Idempotency-Key': 'test-key' },
    })
    expect(data.ok).toBe(true)
  })
})
