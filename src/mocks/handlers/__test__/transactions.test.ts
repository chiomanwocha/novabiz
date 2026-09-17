import type { Transaction } from '../../db/types'

import { type Envelope, setupMockServer } from './setupMockServer'

setupMockServer()

interface TransactionsPage {
  transactions: Transaction[]
  nextCursor: string | null
  total: number
}

describe('GET /api/transactions', () => {
  it('defaults to a page of 50, newest first', async () => {
    const response = await fetch('/api/transactions')
    const body = (await response.json()) as Envelope<TransactionsPage>

    expect(body.data.transactions).toHaveLength(50)
    expect(body.data.nextCursor).not.toBeNull()
    for (let i = 1; i < body.data.transactions.length; i += 1) {
      const previous = body.data.transactions[i - 1]
      const current = body.data.transactions[i]
      expect(previous && current && previous.occurredAt >= current.occurredAt).toBe(true)
    }
  })

  it('paginates via cursor with no gaps or repeats across pages, reporting the same total on every page', async () => {
    const first = (await (
      await fetch('/api/transactions?limit=20')
    ).json()) as Envelope<TransactionsPage>
    const cursor = first.data.nextCursor
    expect(cursor).not.toBeNull()

    const second = (await (
      await fetch(`/api/transactions?limit=20&cursor=${String(cursor)}`)
    ).json()) as Envelope<TransactionsPage>

    const firstIds = new Set(first.data.transactions.map((t) => t.id))
    const overlap = second.data.transactions.filter((t) => firstIds.has(t.id))
    expect(overlap).toHaveLength(0)
    expect(second.data.transactions).toHaveLength(20)
    expect(first.data.total).toBeGreaterThan(20)
    expect(second.data.total).toBe(first.data.total)
  })

  it('filters by status, reporting the total of matching transactions, not the page size', async () => {
    const response = await fetch('/api/transactions?status=failed&limit=1')
    const body = (await response.json()) as Envelope<TransactionsPage>
    expect(body.data.transactions).toHaveLength(1)
    expect(body.data.total).toBeGreaterThan(1)
    for (const transaction of body.data.transactions) {
      expect(transaction.status).toBe('failed')
    }
  })

  it('filters by type', async () => {
    const response = await fetch('/api/transactions?type=credit&limit=50')
    const body = (await response.json()) as Envelope<TransactionsPage>
    for (const transaction of body.data.transactions) {
      expect(transaction.type).toBe('credit')
    }
  })

  it('searches counterparty name and description via q', async () => {
    const first = (await (
      await fetch('/api/transactions?limit=1')
    ).json()) as Envelope<TransactionsPage>
    const target = first.data.transactions[0]
    expect(target).toBeDefined()

    const searchTerm = target?.counterpartyName.split(' ')[0]
    const response = await fetch(`/api/transactions?q=${String(searchTerm)}&limit=50`)
    const body = (await response.json()) as Envelope<TransactionsPage>

    expect(body.data.transactions.length).toBeGreaterThan(0)
    for (const transaction of body.data.transactions) {
      const haystack = `${transaction.counterpartyName} ${transaction.description}`.toLowerCase()
      expect(haystack.includes(String(searchTerm).toLowerCase())).toBe(true)
    }
  })

  // Regression case: picking a single day (from and to both that day) used to show nothing
  // for it, while a two-day range ending on that same day did show something — traced to the
  // handler parsing "YYYY-MM-DD" with `new Date(string)`, which is UTC midnight, while the
  // picker builds that string from the *local* calendar day. `to` also only matched the exact
  // instant of that UTC midnight rather than the whole day. This proves a single picked day
  // now returns exactly the transactions that occurred on it, using the same local-day
  // construction the real `DateRangeField` uses to build the filter values.
  it('includes every transaction from a single picked day, not just an instant at midnight', async () => {
    const all = (await (
      await fetch('/api/transactions?limit=5000')
    ).json()) as Envelope<TransactionsPage>
    const sample = all.data.transactions[0]
    if (!sample) {
      throw new Error('expected at least one seeded transaction')
    }
    const occurred = new Date(sample.occurredAt)
    const year = occurred.getFullYear()
    const month = String(occurred.getMonth() + 1).padStart(2, '0')
    const day = String(occurred.getDate()).padStart(2, '0')
    const isoDay = `${String(year)}-${month}-${day}`

    const response = await fetch(`/api/transactions?from=${isoDay}&to=${isoDay}&limit=5000`)
    const body = (await response.json()) as Envelope<TransactionsPage>

    expect(body.data.total).toBeGreaterThan(0)
    for (const transaction of body.data.transactions) {
      const transactionDay = new Date(transaction.occurredAt)
      expect(transactionDay.getFullYear()).toBe(year)
      expect(transactionDay.getMonth() + 1).toBe(Number(month))
      expect(transactionDay.getDate()).toBe(Number(day))
    }
  })

  it('returns an empty page (not an error) for a filter combination with no matches', async () => {
    const response = await fetch('/api/transactions?q=zzzznomatchzzzz')
    const body = (await response.json()) as Envelope<TransactionsPage>
    expect(response.status).toBe(200)
    expect(body.data.transactions).toHaveLength(0)
    expect(body.data.nextCursor).toBeNull()
    expect(body.data.total).toBe(0)
  })
})
