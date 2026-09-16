import { ApiError } from '../../api/errors'
import { retryDelayMs, shouldRetryQuery } from '../queryClient'

describe('shouldRetryQuery', () => {
  it('retries a timeout error up to 3 attempts', () => {
    const error = new ApiError({ kind: 'timeout', status: null, message: 'timed out' })
    expect(shouldRetryQuery(0, error)).toBe(true)
    expect(shouldRetryQuery(1, error)).toBe(true)
    expect(shouldRetryQuery(2, error)).toBe(true)
    expect(shouldRetryQuery(3, error)).toBe(false)
  })

  it('never retries a 422 http error, even on the first attempt', () => {
    const error = new ApiError({ kind: 'http', status: 422, message: 'invalid' })
    expect(shouldRetryQuery(0, error)).toBe(false)
  })
})

describe('retryDelayMs', () => {
  it('backs off exponentially, capped at 8000ms', () => {
    expect(retryDelayMs(0)).toBe(1000)
    expect(retryDelayMs(1)).toBe(2000)
    expect(retryDelayMs(2)).toBe(4000)
    expect(retryDelayMs(3)).toBe(8000)
    expect(retryDelayMs(10)).toBe(8000)
  })
})
