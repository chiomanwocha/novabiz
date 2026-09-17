import { toKobo } from '../../../../lib/money'
import { computeLimitUsagePercent } from '../limitUsage'

describe('computeLimitUsagePercent', () => {
  it('computes a rounded percentage', () => {
    expect(computeLimitUsagePercent(toKobo(300_000), toKobo(2_000_000))).toBe(15)
  })

  it('clamps to 100 when used exceeds the limit', () => {
    expect(computeLimitUsagePercent(toKobo(2_500_000), toKobo(2_000_000))).toBe(100)
  })

  it('returns 0 when nothing has been used', () => {
    expect(computeLimitUsagePercent(toKobo(0), toKobo(2_000_000))).toBe(0)
  })

  it('returns 0 for a zero daily limit instead of dividing by zero', () => {
    expect(computeLimitUsagePercent(toKobo(0), toKobo(0))).toBe(0)
  })
})
