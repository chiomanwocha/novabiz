import { onlineManager } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'

import { useOnlineStatus } from '../useOnlineStatus'

describe('useOnlineStatus', () => {
  afterEach(() => {
    onlineManager.setOnline(true)
  })

  it('reflects the current onlineManager state', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  it('updates when onlineManager reports offline, and back online again', () => {
    const { result } = renderHook(() => useOnlineStatus())

    act(() => {
      onlineManager.setOnline(false)
    })
    expect(result.current).toBe(false)

    act(() => {
      onlineManager.setOnline(true)
    })
    expect(result.current).toBe(true)
  })
})
