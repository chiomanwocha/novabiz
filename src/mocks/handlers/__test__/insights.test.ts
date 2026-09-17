import { setControls } from '../../controls'

import { type Envelope, setupMockServer } from './setupMockServer'

setupMockServer()

interface InsightsBody {
  weekOverWeek: { thisWeekInflowKobo: number; lastWeekInflowKobo: number }
  topPayer: { name: string; totalKobo: number; transactionCount: number } | null
  busiestDay: { dayLabel: string; transactionCount: number } | null
}

describe('GET /api/merchant/insights', () => {
  it('returns an insights envelope with code 200', async () => {
    const response = await fetch('/api/merchant/insights')
    expect(response.status).toBe(200)

    const body = (await response.json()) as Envelope<InsightsBody>
    expect(body.code).toBe(200)
    expect(typeof body.data.weekOverWeek.thisWeekInflowKobo).toBe('number')
    // The seeded 60-day feed always has plenty of activity in the last 30 days.
    expect(body.data.topPayer).not.toBeNull()
    expect(body.data.busiestDay).not.toBeNull()
  })

  it('returns a 500 envelope when failRate forces a failure', async () => {
    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const response = await fetch('/api/merchant/insights')
    expect(response.status).toBe(500)

    const body = (await response.json()) as Envelope<null>
    expect(body.code).toBe(500)
    expect(body.data).toBeNull()
  })
})
