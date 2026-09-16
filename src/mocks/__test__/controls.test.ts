import {
  getControls,
  loadControlsFromSearchParams,
  randomLatencyMs,
  setControls,
} from '../controls'

describe('controls', () => {
  beforeEach(() => {
    setControls({ fixedLatencyMs: null, failRate: 0, timeoutMode: false })
  })

  it('reads failRate from the URL', () => {
    loadControlsFromSearchParams('?failRate=1')
    expect(getControls().failRate).toBe(1)
  })

  it('clamps failRate to the 0-1 range', () => {
    loadControlsFromSearchParams('?failRate=5')
    expect(getControls().failRate).toBe(1)
  })

  it('reads timeoutMode from the URL as a boolean', () => {
    loadControlsFromSearchParams('?timeoutMode=1')
    expect(getControls().timeoutMode).toBe(true)
  })

  it('reads a fixed latency override from the URL', () => {
    loadControlsFromSearchParams('?latency=0')
    expect(randomLatencyMs()).toBe(0)
  })

  it('leaves controls untouched when no relevant params are present', () => {
    loadControlsFromSearchParams('?somethingElse=1')
    expect(getControls()).toEqual({ fixedLatencyMs: null, failRate: 0, timeoutMode: false })
  })

  it('falls back to the default random range when no fixed latency is set', () => {
    const latency = randomLatencyMs()
    expect(latency).toBeGreaterThanOrEqual(400)
    expect(latency).toBeLessThanOrEqual(1200)
  })
})
