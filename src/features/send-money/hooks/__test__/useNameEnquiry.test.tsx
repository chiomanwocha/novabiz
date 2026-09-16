import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { setControls } from '../../../../mocks/controls'
import { setupMockServer } from '../../../../mocks/handlers/__test__/setupMockServer'
import { createTestQueryClient } from '../../../../test/queryClient'
import { useNameEnquiry } from '../useNameEnquiry'

// The real REQUEST_TIMEOUT_MS is 10s — mocked small so the timeout case doesn't make the
// suite slow. vi.mock is hoisted above other statements, so the factory can't reference
// any outer variable (same pattern used throughout the handler tests).
vi.mock('../../../../config/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../config/constants')>()),
  REQUEST_TIMEOUT_MS: 400,
}))

const mockTimeoutMs = 400

setupMockServer()

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('useNameEnquiry', () => {
  it('is idle until a bank is selected and the number is 10 digits', () => {
    const { result } = renderHook(() => useNameEnquiry({ bankCode: null, accountNumber: '' }), {
      wrapper,
    })
    expect(result.current.status).toBe('idle')
  })

  it('stays idle while the check digit is invalid, even with 10 digits and a bank selected', () => {
    const { result } = renderHook(
      () => useNameEnquiry({ bankCode: '011', accountNumber: '1234567890' }),
      { wrapper },
    )
    expect(result.current.status).toBe('idle')
  })

  it('resolves a name and ref for a valid account number', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(
      () => useNameEnquiry({ bankCode: '011', accountNumber: '0102030400' }),
      { wrapper },
    )

    expect(result.current.status).toBe('checking')
    await waitFor(() => {
      expect(result.current.status).toBe('resolved')
    })
  })

  it('resolves a not_found error for an account ending in 0000', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(
      () => useNameEnquiry({ bankCode: '011', accountNumber: '0000000000' }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.status === 'error' && result.current.reason).toBe('not_found')
  })

  it('resolves a cannot_receive error for an account ending in 1111', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(
      () => useNameEnquiry({ bankCode: '011', accountNumber: '0000021111' }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })
    expect(result.current.status === 'error' && result.current.reason).toBe('cannot_receive')
  })

  it('resolves a timeout error for an account ending in 9999', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result } = renderHook(
      () => useNameEnquiry({ bankCode: '011', accountNumber: '0000089999' }),
      { wrapper },
    )

    await waitFor(
      () => {
        expect(result.current.status).toBe('error')
      },
      { timeout: mockTimeoutMs * 10 },
    )
    expect(result.current.status === 'error' && result.current.reason).toBe('timeout')
  })

  it('clears a resolved name immediately when the account number changes', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const { result, rerender } = renderHook(
      ({ accountNumber }: { accountNumber: string }) =>
        useNameEnquiry({ bankCode: '011', accountNumber }),
      { wrapper, initialProps: { accountNumber: '0102030400' } },
    )

    await waitFor(() => {
      expect(result.current.status).toBe('resolved')
    })

    rerender({ accountNumber: '0000042222' })

    // A different account is a different query key with no cache yet — the old resolved
    // name must not still be showing the instant the key changes.
    expect(result.current.status).toBe('checking')
  })
})
