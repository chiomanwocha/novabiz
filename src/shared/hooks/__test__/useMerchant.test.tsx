import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { setControls } from '../../../mocks/controls'
import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { createTestQueryClient } from '../../../test/queryClient'
import { useMerchant } from '../useMerchant'

setupMockServer()

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('useMerchant', () => {
  it('resolves the merchant from the mock API', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(() => useMerchant(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.name).toBeTruthy()
  })

  it('surfaces a typed ApiError when the request fails', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const { result } = renderHook(() => useMerchant(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error?.message).toBeTruthy()
  })
})
