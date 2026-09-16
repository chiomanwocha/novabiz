import { setControls } from '../../controls'

import { type Envelope, setupMockServer } from './setupMockServer'

setupMockServer()

describe('GET /api/merchant', () => {
  it('returns the merchant envelope with code 200', async () => {
    const response = await fetch('/api/merchant')
    expect(response.status).toBe(200)

    const body = (await response.json()) as Envelope<{ name: string; balanceKobo: number }>
    expect(body.code).toBe(200)
    expect(body.data.name).toBeTruthy()
    expect(typeof body.data.balanceKobo).toBe('number')
  })

  it('returns a 500 envelope when failRate forces a failure', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const response = await fetch('/api/merchant')
    expect(response.status).toBe(500)

    const body = (await response.json()) as Envelope<null>
    expect(body.code).toBe(500)
    expect(body.data).toBeNull()
  })
})
