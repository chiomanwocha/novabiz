import { ApiError, isRetryable, requiresPageReloadToRetry } from '../errors'

describe('ApiError', () => {
  it('carries its kind, status, and message, and is a real Error', () => {
    const error = new ApiError({ kind: 'http', status: 422, message: 'Nope' })
    expect(error.kind).toBe('http')
    expect(error.status).toBe(422)
    expect(error.message).toBe('Nope')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('isRetryable', () => {
  it('retries a network error', () => {
    expect(isRetryable(new ApiError({ kind: 'network', status: null, message: 'x' }))).toBe(true)
  })

  it('retries a timeout error', () => {
    expect(isRetryable(new ApiError({ kind: 'timeout', status: null, message: 'x' }))).toBe(true)
  })

  it('retries a 500 http error', () => {
    expect(isRetryable(new ApiError({ kind: 'http', status: 500, message: 'x' }))).toBe(true)
  })

  it('does not retry a 422 http error', () => {
    expect(isRetryable(new ApiError({ kind: 'http', status: 422, message: 'x' }))).toBe(false)
  })

  it('does not retry a 404 http error', () => {
    expect(isRetryable(new ApiError({ kind: 'http', status: 404, message: 'x' }))).toBe(false)
  })

  it('is false for a value that is not an ApiError', () => {
    expect(isRetryable(new Error('plain'))).toBe(false)
  })

  it('does not automatically retry an invalidResponse error', () => {
    expect(isRetryable(new ApiError({ kind: 'invalidResponse', status: 200, message: 'x' }))).toBe(
      false,
    )
  })
})

describe('requiresPageReloadToRetry', () => {
  it('is true for an invalidResponse error', () => {
    expect(
      requiresPageReloadToRetry(
        new ApiError({ kind: 'invalidResponse', status: 200, message: 'x' }),
      ),
    ).toBe(true)
  })

  it('is false for other error kinds', () => {
    expect(
      requiresPageReloadToRetry(new ApiError({ kind: 'http', status: 500, message: 'x' })),
    ).toBe(false)
  })

  it('is false for a value that is not an ApiError', () => {
    expect(requiresPageReloadToRetry(new Error('plain'))).toBe(false)
  })
})
