import { renderHook } from '@testing-library/react'

import { ApiError } from '../../../api/errors'
import { useRetry } from '../useRetry'

describe('useRetry', () => {
  it('refetches when the error does not require a page reload', () => {
    const refetch = vi.fn()
    const { result } = renderHook(() =>
      useRetry({
        error: new ApiError({ kind: 'network', status: null, message: 'oops' }),
        refetch,
      }),
    )

    result.current()

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('reloads the page instead of refetching when the error is an invalidResponse', () => {
    const refetch = vi.fn()
    const reload = vi.fn()
    vi.stubGlobal('location', { reload })

    const { result } = renderHook(() =>
      useRetry({
        error: new ApiError({ kind: 'invalidResponse', status: 200, message: 'oops' }),
        refetch,
      }),
    )

    result.current()

    expect(reload).toHaveBeenCalledOnce()
    expect(refetch).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})
