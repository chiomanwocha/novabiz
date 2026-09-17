import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'

import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { server } from '../../../../mocks/node'
import { renderWithQueryClient } from '../../../../testUtils/renderWithQueryClient'
import { TransactionFeed } from '../TransactionFeed'

setupMockServer()

// @tanstack/react-virtual measures the scroll container via offsetHeight/offsetWidth, which
// jsdom always reports as 0 — without this, the virtualizer sees a zero-height viewport and
// renders no rows at all, regardless of how much data has loaded.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 480,
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 400,
  })
})

describe('TransactionFeed', () => {
  it('renders a bounded number of rows in the DOM, not the whole loaded page', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    renderWithQueryClient(<TransactionFeed />)

    const list = await screen.findByRole('list')
    await waitFor(() => {
      expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0)
    })

    // The mock page size is 50 — the DOM should hold far fewer rows than that if
    // virtualization is actually windowing the list rather than rendering every row.
    expect(within(list).getAllByRole('listitem').length).toBeLessThan(30)
  })

  it('shows an error with Retry when the feed fails to load, and recovers on retry', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const user = userEvent.setup()
    renderWithQueryClient(<TransactionFeed />)

    const retryButton = await screen.findByRole('button', { name: 'Retry' })
    expect(screen.getByRole('alert')).toBeInTheDocument()

    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    await user.click(retryButton)

    await waitFor(() => {
      expect(screen.getByRole('list')).toBeInTheDocument()
    })
  })

  it('shows how many transactions have loaded out of the total matching the filters', async () => {
    server.use(
      http.get('/api/transactions', () =>
        HttpResponse.json({
          code: 200,
          message: 'OK',
          data: {
            transactions: Array.from({ length: 12 }, (_, index) => ({
              id: `txn-${String(index)}`,
              type: 'credit',
              status: 'successful',
              amountKobo: 5000,
              counterpartyName: 'Chidi Eze',
              counterpartyAccountNumber: '0099887766',
              counterpartyBankCode: '058',
              counterpartyBankName: 'GTBank',
              description: 'Stock payment',
              occurredAt: '2026-09-16T10:00:00.000Z',
            })),
            nextCursor: null,
            total: 12,
          },
        }),
      ),
    )
    renderWithQueryClient(<TransactionFeed />)

    expect(await screen.findByText('12 of 12')).toBeInTheDocument()
  })

  it('shows an empty state when there are no matching transactions', async () => {
    server.use(
      http.get('/api/transactions', () =>
        HttpResponse.json({
          code: 200,
          message: 'OK',
          data: { transactions: [], nextCursor: null, total: 0 },
        }),
      ),
    )
    renderWithQueryClient(<TransactionFeed />)

    expect(await screen.findByText('No transactions yet')).toBeInTheDocument()
  })
})
