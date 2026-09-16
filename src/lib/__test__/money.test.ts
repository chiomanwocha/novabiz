import { formatKobo, parseNairaToKobo, sumKobo, toKobo } from '../money'

describe('toKobo', () => {
  it('brands a safe integer as Kobo', () => {
    expect(toKobo(100)).toBe(100)
  })

  it('rejects a non-integer amount', () => {
    expect(() => toKobo(100.5)).toThrow(RangeError)
  })

  it('rejects an unsafe integer', () => {
    expect(() => toKobo(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError)
  })
})

describe('formatKobo', () => {
  it('formats zero', () => {
    expect(formatKobo(toKobo(0))).toBe('₦0.00')
  })

  it('formats one kobo', () => {
    expect(formatKobo(toKobo(1))).toBe('₦0.01')
  })

  it('formats a mixed naira-and-kobo amount with thousands grouping', () => {
    expect(formatKobo(toKobo(100050))).toBe('₦1,000.50')
  })

  it('formats negative amounts with a leading minus sign', () => {
    expect(formatKobo(toKobo(-100050))).toBe('-₦1,000.50')
  })

  it('formats a very large amount', () => {
    expect(formatKobo(toKobo(999999999999))).toBe('₦9,999,999,999.99')
  })
})

describe('parseNairaToKobo', () => {
  it('parses a two-decimal amount', () => {
    expect(parseNairaToKobo('1.13')).toBe(113)
  })

  it('parses an amount under one naira', () => {
    expect(parseNairaToKobo('0.29')).toBe(29)
  })

  it('parses a comma-grouped amount with one decimal place', () => {
    expect(parseNairaToKobo('1,000.5')).toBe(100050)
  })

  it('parses a whole-naira amount with no decimal part', () => {
    expect(parseNairaToKobo('500')).toBe(50000)
  })

  it('strips spaces around the input', () => {
    expect(parseNairaToKobo(' 1,000.50 ')).toBe(100050)
  })

  it('rejects an amount with three decimal places', () => {
    expect(parseNairaToKobo('1.234')).toBeNull()
  })

  it('rejects non-numeric input', () => {
    expect(parseNairaToKobo('abc')).toBeNull()
  })

  it('rejects an empty string', () => {
    expect(parseNairaToKobo('')).toBeNull()
  })

  it('rejects a negative amount', () => {
    expect(parseNairaToKobo('-5')).toBeNull()
  })

  // Decision (documented per CLAUDE.md 6.1): a leading dot with no naira digit is
  // rejected rather than treated as "0.5" — an amount must always have at least one
  // digit before the decimal point, so what the user typed is unambiguous.
  it('rejects a leading-dot amount with no naira digit', () => {
    expect(parseNairaToKobo('.5')).toBeNull()
  })
})

describe('sumKobo', () => {
  it('adds kobo values as integers', () => {
    expect(sumKobo([toKobo(100), toKobo(250), toKobo(1)])).toBe(351)
  })

  it('sums to zero for an empty list', () => {
    expect(sumKobo([])).toBe(0)
  })

  it('does not lose precision the way parseFloat-based cents math would', () => {
    // Regression guard: 1.13 + 2.02 naira computed the wrong way
    // (parseFloat("1.13") * 100 + parseFloat("2.02") * 100) drifts off 315 due to
    // binary floating-point rounding. Going through parseNairaToKobo avoids that.
    const a = parseNairaToKobo('1.13')
    const b = parseNairaToKobo('2.02')
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    expect(sumKobo([toKobo(a ?? 0), toKobo(b ?? 0)])).toBe(315)
  })
})
