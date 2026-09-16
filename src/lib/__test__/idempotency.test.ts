import { createIdempotencyKey } from '../idempotency'

describe('createIdempotencyKey', () => {
  it('returns a UUID-shaped string', () => {
    expect(createIdempotencyKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })

  it('returns a unique value on every call', () => {
    const keys = Array.from({ length: 20 }, () => createIdempotencyKey())
    expect(new Set(keys).size).toBe(keys.length)
  })
})
