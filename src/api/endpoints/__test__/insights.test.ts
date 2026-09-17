import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { getMerchantInsights } from '../insights'

setupMockServer()

describe('getMerchantInsights', () => {
  it('resolves insights with an integer week-over-week inflow', async () => {
    const insights = await getMerchantInsights()
    expect(Number.isSafeInteger(insights.weekOverWeek.thisWeekInflowKobo)).toBe(true)
    expect(Number.isSafeInteger(insights.weekOverWeek.lastWeekInflowKobo)).toBe(true)
  })
})
