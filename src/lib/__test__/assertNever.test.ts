import { assertNever } from '../assertNever'

describe('assertNever', () => {
  it('throws when reached at runtime', () => {
    // Cast bypasses the compile-time `never` guarantee to test the runtime fallback.
    expect(() => assertNever('unexpected' as never)).toThrow(/Unexpected value/)
  })
})
