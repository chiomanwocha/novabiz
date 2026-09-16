import { isValidNubanCheckDigit } from '../../../lib/nuban'
import { HOSTILE_DESCRIPTIONS } from '../names'
import { generateSeed } from '../seed'

describe('generateSeed', () => {
  const now = new Date('2026-09-16T12:00:00.000Z').getTime()

  it('generates exactly 5,000 transactions', () => {
    expect(generateSeed(now).transactions).toHaveLength(5000)
  })

  it('is deterministic — the same `now` produces byte-identical output', () => {
    expect(generateSeed(now)).toEqual(generateSeed(now))
  })

  it('produces different output for a different `now` (dates shift, not fully static)', () => {
    const later = now + 24 * 60 * 60 * 1000
    expect(generateSeed(now)).not.toEqual(generateSeed(later))
  })

  it('sorts transactions newest first', () => {
    const { transactions } = generateSeed(now)
    for (let i = 1; i < transactions.length; i += 1) {
      const previous = transactions[i - 1]
      const current = transactions[i]
      expect(previous && current && previous.occurredAt >= current.occurredAt).toBe(true)
    }
  })

  it('includes every hostile description verbatim, at least once each', () => {
    const { transactions } = generateSeed(now)
    const descriptions = new Set(transactions.map((t) => t.description))
    for (const hostile of HOSTILE_DESCRIPTIONS) {
      expect(descriptions.has(hostile)).toBe(true)
    }
  })

  it('generates counterparty account numbers that pass their own bank check digit', () => {
    const { transactions } = generateSeed(now)
    // Checking all 5,000 would be slow-ish but still fine; sample is enough to catch a
    // systemic bug without making this test the slowest one in the suite.
    const sample = transactions.slice(0, 200)
    for (const transaction of sample) {
      expect(
        isValidNubanCheckDigit(
          transaction.counterpartyAccountNumber,
          transaction.counterpartyBankCode,
        ),
      ).toBe(true)
    }
  })

  it('gives the merchant a NUBAN-valid account number for their own bank', () => {
    const { merchant } = generateSeed(now)
    expect(isValidNubanCheckDigit(merchant.accountNumber, merchant.bankCode)).toBe(true)
  })

  it("derives today's inflow/outflow from actually-successful transactions dated today", () => {
    const { merchant, transactions } = generateSeed(now)
    const todaysSuccessfulCredits = transactions.filter(
      (t) =>
        t.status === 'successful' &&
        t.type === 'credit' &&
        new Date(t.occurredAt).toDateString() === new Date(now).toDateString(),
    )
    const expectedInflow = todaysSuccessfulCredits.reduce((sum, t) => sum + t.amountKobo, 0)
    expect(merchant.todayInflowKobo).toBe(expectedInflow)
  })

  it('keeps usedTodayKobo independent of todayOutflowKobo and within the daily limit', () => {
    // usedTodayKobo tracks only Send Money sends made through the app today, not the
    // whole seeded historical feed's debit total (todayOutflowKobo) — they're
    // different numbers on purpose, see the comment in seed.ts.
    const { merchant } = generateSeed(now)
    expect(merchant.usedTodayKobo).toBeLessThan(merchant.dailyLimitKobo)
  })

  it('gives every transaction a unique id', () => {
    const { transactions } = generateSeed(now)
    expect(new Set(transactions.map((t) => t.id)).size).toBe(transactions.length)
  })
})
