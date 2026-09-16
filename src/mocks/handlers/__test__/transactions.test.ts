import type { Transaction } from '../../db/types'

import { type Envelope, setupMockServer } from './setupMockServer'

setupMockServer()

interface TransactionsPage {
  transactions: Transaction[]
  nextCursor: string | null
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

  it('paginates via cursor with no gaps or repeats across pages', async () => {
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
  })

  it('filters by status', async () => {
    const response = await fetch('/api/transactions?status=failed&limit=50')
    const body = (await response.json()) as Envelope<TransactionsPage>
    expect(body.data.transactions.length).toBeGreaterThan(0)
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

  it('returns an empty page (not an error) for a filter combination with no matches', async () => {
    const response = await fetch('/api/transactions?q=zzzznomatchzzzz')
    const body = (await response.json()) as Envelope<TransactionsPage>
    expect(response.status).toBe(200)
    expect(body.data.transactions).toHaveLength(0)
    expect(body.data.nextCursor).toBeNull()
  })
})
