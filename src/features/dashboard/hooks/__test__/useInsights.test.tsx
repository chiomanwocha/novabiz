import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { createTestQueryClient } from '../../../../testUtils/queryClient'
import { useInsights } from '../useInsights'

setupMockServer()

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('useInsights', () => {
  it('resolves the insights for the seeded transaction feed', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(() => useInsights(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.topPayer).not.toBeNull()
  })

  it('surfaces a server error', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const { result } = renderHook(() => useInsights(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
