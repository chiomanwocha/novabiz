import { renderHook } from '@testing-library/react'

import { useIdempotencyKey } from '../useIdempotencyKey'

describe('useIdempotencyKey', () => {
  it('keeps the same key across re-renders when the signature is unchanged', () => {
    const { result, rerender } = renderHook(({ signature }) => useIdempotencyKey(signature), {
      initialProps: { signature: '011:0102030400:100050:' },
    })
    const firstKey = result.current

    rerender({ signature: '011:0102030400:100050:' })

    expect(result.current).toBe(firstKey)
  })

  it('creates a new key when the signature changes', () => {
    const { result, rerender } = renderHook(({ signature }) => useIdempotencyKey(signature), {
      initialProps: { signature: '011:0102030400:100050:' },
    })
    const firstKey = result.current

    rerender({ signature: '011:0102030400:200000:' })

    expect(result.current).not.toBe(firstKey)
  })

  it('creates a fresh key every time the signature changes, even back to a previous value', () => {
    const { result, rerender } = renderHook(({ signature }) => useIdempotencyKey(signature), {
      initialProps: { signature: 'a' },
    })
    const firstKey = result.current

    rerender({ signature: 'b' })
    const secondKey = result.current
    rerender({ signature: 'a' })

    expect(result.current).not.toBe(secondKey)
    expect(result.current).not.toBe(firstKey)
  })
})
