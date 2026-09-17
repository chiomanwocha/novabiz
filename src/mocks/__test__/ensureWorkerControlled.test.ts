import { shouldForceReloadForWorkerControl } from '../ensureWorkerControlled'

describe('shouldForceReloadForWorkerControl', () => {
  it('forces a reload when the page is uncontrolled and none has been attempted yet', () => {
    expect(
      shouldForceReloadForWorkerControl({ isControlled: false, alreadyAttemptedReload: false }),
    ).toBe(true)
  })

  it('does not reload when the page is already controlled', () => {
    expect(
      shouldForceReloadForWorkerControl({ isControlled: true, alreadyAttemptedReload: false }),
    ).toBe(false)
  })

  it('does not reload again if a reload was already attempted, to avoid looping', () => {
    expect(
      shouldForceReloadForWorkerControl({ isControlled: false, alreadyAttemptedReload: true }),
    ).toBe(false)
  })
})
