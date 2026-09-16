import { type Envelope, setupMockServer } from './setupMockServer'

setupMockServer()

describe('GET /api/banks', () => {
  it('returns a non-empty list of {code, name} entries', async () => {
    const response = await fetch('/api/banks')
    expect(response.status).toBe(200)

    const body = (await response.json()) as Envelope<{ code: string; name: string }[]>
    expect(body.data.length).toBeGreaterThan(0)
    for (const bank of body.data) {
      expect(bank).toHaveProperty('code')
      expect(bank).toHaveProperty('name')
    }
  })
})
