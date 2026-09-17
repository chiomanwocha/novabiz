import { http, HttpResponse } from 'msw'

import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { server } from '../../../mocks/node'
import { getTransactions, transactionsQueryKey } from '../transactions'

setupMockServer()

describe('getTransactions', () => {
  it('requests /api/transactions with no query string when called with no params', async () => {
    let requestedUrl = ''
    server.use(
      http.get('/api/transactions', ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json({
          code: 200,
          message: 'OK',
          data: { transactions: [], nextCursor: null, total: 0 },
        })
      }),
    )

    await getTransactions()
    expect(new URL(requestedUrl).search).toBe('')
  })

  it('encodes cursor, limit, filters, and search into the query string', async () => {
    let requestedUrl = ''
    server.use(
      http.get('/api/transactions', ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json({
          code: 200,
          message: 'OK',
          data: { transactions: [], nextCursor: null, total: 0 },
        })
      }),
    )

    await getTransactions({
      cursor: 'seed-0049',
      limit: 20,
      from: '2026-09-01',
      to: '2026-09-16',
      status: 'successful',
      type: 'credit',
      q: 'Ade',
    })

    const params = new URL(requestedUrl).searchParams
    expect(params.get('cursor')).toBe('seed-0049')
    expect(params.get('limit')).toBe('20')
    expect(params.get('from')).toBe('2026-09-01')
    expect(params.get('to')).toBe('2026-09-16')
    expect(params.get('status')).toBe('successful')
    expect(params.get('type')).toBe('credit')
    expect(params.get('q')).toBe('Ade')
  })

  it('resolves a real page of transactions from the seeded data, with the total of every matching transaction', async () => {
    const page = await getTransactions({ limit: 5 })
    expect(page.transactions.length).toBe(5)
    expect(page.nextCursor).toBeTruthy()
    expect(page.total).toBeGreaterThan(5)
  })
})

describe('transactionsQueryKey', () => {
  it('produces the same key for no filters and the full all-null shape useTransactionFilterParams always returns', () => {
    expect(transactionsQueryKey({})).toEqual(
      transactionsQueryKey({ from: null, to: null, status: null, type: null, q: null }),
    )
  })

  it('produces the same key regardless of which optional fields are present', () => {
    expect(transactionsQueryKey()).toEqual(transactionsQueryKey({ status: null }))
  })

  it('produces a different key when a real filter is applied', () => {
    expect(transactionsQueryKey()).not.toEqual(transactionsQueryKey({ status: 'successful' }))
  })
})
