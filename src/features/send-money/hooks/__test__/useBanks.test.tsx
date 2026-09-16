import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { createTestQueryClient } from '../../../../test/queryClient'
import { useBanks } from '../useBanks'

setupMockServer()

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('useBanks', () => {
  it('resolves the mock bank list', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(() => useBanks(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.length).toBeGreaterThan(0)
  })
})
