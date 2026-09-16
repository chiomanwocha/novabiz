import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { useTransactionFilterParams } from '../useTransactionFilterParams'

function wrapperWithEntry(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  }
}

describe('useTransactionFilterParams', () => {
  it('parses known filter values from the URL', () => {
    const { result } = renderHook(() => useTransactionFilterParams(), {
      wrapper: wrapperWithEntry(
        '/?status=successful&type=credit&q=Ade&from=2026-09-01&to=2026-09-16',
      ),
    })

    expect(result.current.filters).toEqual({
      from: '2026-09-01',
      to: '2026-09-16',
      status: 'successful',
      type: 'credit',
      q: 'Ade',
    })
  })

  it('drops an invalid status or type from a tampered URL rather than passing it through', () => {
    const { result } = renderHook(() => useTransactionFilterParams(), {
      wrapper: wrapperWithEntry('/?status=not-a-real-status&type=nonsense'),
    })

    expect(result.current.filters.status).toBeNull()
    expect(result.current.filters.type).toBeNull()
  })

  it('defaults every filter to null when the URL has no params', () => {
    const { result } = renderHook(() => useTransactionFilterParams(), {
      wrapper: wrapperWithEntry('/'),
    })

    expect(result.current.filters).toEqual({
      from: null,
      to: null,
      status: null,
      type: null,
      q: null,
    })
  })

  it('setFilters writes the new values back so filters reflects them', () => {
    const { result } = renderHook(() => useTransactionFilterParams(), {
      wrapper: wrapperWithEntry('/'),
    })

    act(() => {
      result.current.setFilters({ from: null, to: null, status: 'failed', type: null, q: 'rice' })
    })

    expect(result.current.filters).toEqual({
      from: null,
      to: null,
      status: 'failed',
      type: null,
      q: 'rice',
    })
  })
})
