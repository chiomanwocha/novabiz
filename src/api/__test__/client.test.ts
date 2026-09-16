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
