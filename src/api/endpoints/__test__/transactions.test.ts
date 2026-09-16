import { http, HttpResponse } from 'msw'

import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { server } from '../../../mocks/node'
import { getTransactions } from '../transactions'

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
          data: { transactions: [], nextCursor: null },
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
          data: { transactions: [], nextCursor: null },
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

  it('resolves a real page of transactions from the seeded data', async () => {
    const page = await getTransactions({ limit: 5 })
    expect(page.transactions.length).toBe(5)
    expect(page.nextCursor).toBeTruthy()
  })
})
