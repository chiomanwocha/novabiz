import { toKobo } from '../../../../lib/money'
import { createAmountSchema, type AmountLimits } from '../schemas'

const LIMITS: AmountLimits = {
  balanceKobo: toKobo(31_450_075),
  singleTransferLimitKobo: toKobo(500_000),
  remainingDailyLimitKobo: toKobo(1_700_000),
}

function amountError(amountNaira: string, narration = ''): string | undefined {
  const result = createAmountSchema(LIMITS).safeParse({ amountNaira, narration })
  return result.success ? undefined : result.error.issues[0]?.message
}

describe('createAmountSchema', () => {
  it('rejects zero', () => {
    expect(amountError('0')).toBe('Enter an amount greater than zero')
  })

  it('rejects an amount with 3 decimal places', () => {
    expect(amountError('1.234')).toBe('Enter an amount greater than zero')
  })

  it('rejects an amount over the available balance', () => {
    const result = createAmountSchema({
      ...LIMITS,
      balanceKobo: toKobo(1_000_00),
      singleTransferLimitKobo: toKobo(500_000),
    }).safeParse({ amountNaira: '2,000.00', narration: '' })
    expect(result.success).toBe(false)
    expect(!result.success && result.error.issues[0]?.message).toBe(
      'This is more than your available balance',
    )
  })

  it('rejects an amount over the single-transfer limit', () => {
    expect(amountError('5,500.00')).toBe('This is more than you can send in one transfer')
  })

  it("rejects an amount over what's left of the daily limit", () => {
    const tightLimits: AmountLimits = {
      ...LIMITS,
      remainingDailyLimitKobo: toKobo(100_00),
    }
    const result = createAmountSchema(tightLimits).safeParse({
      amountNaira: '200.00',
      narration: '',
    })
    expect(result.success).toBe(false)
    expect(!result.success && result.error.issues[0]?.message).toBe(
      "This is more than what's left of today's sending limit",
    )
  })

  it('rejects a narration over 100 characters', () => {
    const result = createAmountSchema(LIMITS).safeParse({
      amountNaira: '1,000.50',
      narration: 'a'.repeat(101),
    })
    expect(result.success).toBe(false)
    expect(!result.success && result.error.issues[0]?.message).toBe(
      'Keep this to 100 characters or fewer',
    )
  })

  it('accepts a valid comma-grouped amount and parses it to kobo', () => {
    const result = createAmountSchema(LIMITS).safeParse({
      amountNaira: '1,000.50',
      narration: 'Stock top-up',
    })
    expect(result.success).toBe(true)
  })
})
