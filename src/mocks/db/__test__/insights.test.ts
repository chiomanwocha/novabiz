import { toKobo } from '../../../lib/money'
import { computeInsights } from '../insights'
import type { Transaction } from '../types'

const NOW = new Date('2026-09-16T12:00:00.000Z').getTime()
const DAY_MS = 86_400_000

let nextId = 0

function makeTransaction(
  overrides: Partial<Transaction> & Pick<Transaction, 'occurredAt'>,
): Transaction {
  nextId += 1
  return {
    id: `t-${String(nextId)}`,
    type: 'credit',
    status: 'successful',
    amountKobo: toKobo(1000),
    counterpartyName: 'Ada Obi',
    counterpartyAccountNumber: '0123456789',
    counterpartyBankCode: '058',
    counterpartyBankName: 'Guaranty Trust Bank',
    description: 'Payment',
    ...overrides,
  }
}

describe('computeInsights', () => {
  it("sums this week's successful credits separately from last week's", () => {
    const transactions = [
      makeTransaction({
        occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(),
        amountKobo: toKobo(1000),
      }),
      makeTransaction({
        occurredAt: new Date(NOW - 2 * DAY_MS).toISOString(),
        amountKobo: toKobo(2000),
      }),
      makeTransaction({
        occurredAt: new Date(NOW - 10 * DAY_MS).toISOString(),
        amountKobo: toKobo(500),
      }),
    ]

    const insights = computeInsights(transactions, NOW)

    expect(insights.weekOverWeek.thisWeekInflowKobo).toBe(3000)
    expect(insights.weekOverWeek.lastWeekInflowKobo).toBe(500)
  })

  it('excludes debits and unsuccessful transactions from the weekly totals', () => {
    const transactions = [
      makeTransaction({ occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(), type: 'debit' }),
      makeTransaction({ occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(), status: 'pending' }),
      makeTransaction({ occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(), status: 'failed' }),
    ]

    const insights = computeInsights(transactions, NOW)

    expect(insights.weekOverWeek.thisWeekInflowKobo).toBe(0)
  })

  it('picks the payer with the highest total credited in the last 30 days', () => {
    const transactions = [
      makeTransaction({
        occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(),
        counterpartyName: 'Ada Obi',
        amountKobo: toKobo(3000),
      }),
      makeTransaction({
        occurredAt: new Date(NOW - 2 * DAY_MS).toISOString(),
        counterpartyName: 'Ada Obi',
        amountKobo: toKobo(3000),
      }),
      makeTransaction({
        occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(),
        counterpartyName: 'Bola Shonibare',
        amountKobo: toKobo(4000),
      }),
    ]

    const insights = computeInsights(transactions, NOW)

    expect(insights.topPayer).toEqual({ name: 'Ada Obi', totalKobo: 6000, transactionCount: 2 })
  })

  it('ignores payments older than 30 days when picking the top payer', () => {
    const transactions = [
      makeTransaction({
        occurredAt: new Date(NOW - 40 * DAY_MS).toISOString(),
        counterpartyName: 'Old Payer',
        amountKobo: toKobo(1_000_000),
      }),
      makeTransaction({
        occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(),
        counterpartyName: 'Recent Payer',
        amountKobo: toKobo(500),
      }),
    ]

    const insights = computeInsights(transactions, NOW)

    expect(insights.topPayer?.name).toBe('Recent Payer')
  })

  it('returns null for topPayer when there are no credits in the last 30 days', () => {
    const transactions = [
      makeTransaction({ occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(), type: 'debit' }),
    ]

    expect(computeInsights(transactions, NOW).topPayer).toBeNull()
  })

  it('picks the day of week with the most successful transactions in the last 30 days', () => {
    const busyDay = new Date(NOW - 3 * DAY_MS).toISOString()
    const quietDay = new Date(NOW - 4 * DAY_MS).toISOString()
    const transactions = [
      makeTransaction({ occurredAt: busyDay }),
      makeTransaction({ occurredAt: busyDay, type: 'debit' }),
      makeTransaction({ occurredAt: busyDay }),
      makeTransaction({ occurredAt: quietDay }),
    ]

    const insights = computeInsights(transactions, NOW)
    const expectedLabel = new Date(busyDay).toLocaleDateString('en-US', { weekday: 'long' })

    expect(insights.busiestDay).toEqual({ dayLabel: expectedLabel, transactionCount: 3 })
  })

  it('returns null for busiestDay when there is no recent activity', () => {
    const transactions = [
      makeTransaction({ occurredAt: new Date(NOW - 40 * DAY_MS).toISOString() }),
    ]

    expect(computeInsights(transactions, NOW).busiestDay).toBeNull()
  })

  it('averages credit amounts from the last 30 days', () => {
    const transactions = [
      makeTransaction({
        occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(),
        amountKobo: toKobo(1000),
      }),
      makeTransaction({
        occurredAt: new Date(NOW - 2 * DAY_MS).toISOString(),
        amountKobo: toKobo(3000),
      }),
    ]

    expect(computeInsights(transactions, NOW).averageSaleKobo).toBe(2000)
  })

  it('excludes debits and old transactions from the average sale', () => {
    const transactions = [
      makeTransaction({
        occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(),
        type: 'debit',
        amountKobo: toKobo(9000),
      }),
      makeTransaction({
        occurredAt: new Date(NOW - 40 * DAY_MS).toISOString(),
        amountKobo: toKobo(9000),
      }),
      makeTransaction({
        occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(),
        amountKobo: toKobo(1000),
      }),
    ]

    expect(computeInsights(transactions, NOW).averageSaleKobo).toBe(1000)
  })

  it('returns null for averageSaleKobo when there are no recent credits', () => {
    const transactions = [
      makeTransaction({ occurredAt: new Date(NOW - 1 * DAY_MS).toISOString(), type: 'debit' }),
    ]

    expect(computeInsights(transactions, NOW).averageSaleKobo).toBeNull()
  })
})
