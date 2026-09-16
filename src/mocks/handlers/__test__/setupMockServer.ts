import { setControls } from '../../controls'
import { resetStore } from '../../db/store'
import { server } from '../../node'

export const TEST_NOW = new Date('2026-09-16T12:00:00.000Z').getTime()

export interface Envelope<T> {
  code: number
  message: string
  data: T
}

/** Starts the MSW node server and resets controls/store to a known state before each test. */
export function setupMockServer(): void {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })
  afterEach(() => {
    server.resetHandlers()
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    resetStore(TEST_NOW)
  })
  afterAll(() => {
    server.close()
  })
}
