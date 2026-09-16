import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { createTestQueryClient } from '../../../../test/queryClient'
import { useTransactions } from '../useTransactions'

setupMockServer()

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('useTransactions', () => {
  it('fetches the first page', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(() => useTransactions(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.pages[0]?.transactions.length).toBeGreaterThan(0)
    expect(result.current.hasNextPage).toBe(true)
  })

  it('appends the next page on fetchNextPage, without losing the first', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(() => useTransactions(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    const firstPageCount = result.current.data?.pages[0]?.transactions.length ?? 0

    await result.current.fetchNextPage()

    await waitFor(() => {
      expect(result.current.data?.pages.length).toBe(2)
    })
    const total = result.current.data?.pages.flatMap((page) => page.transactions).length ?? 0
    expect(total).toBe(firstPageCount * 2)
  })

  it('applies filters, so every resolved transaction matches them', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(() => useTransactions({ type: 'credit' }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    const transactions = result.current.data?.pages[0]?.transactions ?? []
    expect(transactions.length).toBeGreaterThan(0)
    expect(transactions.every((transaction) => transaction.type === 'credit')).toBe(true)
  })
})
