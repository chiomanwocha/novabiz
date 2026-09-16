import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { getMerchant } from '../merchant'

setupMockServer()

describe('getMerchant', () => {
  it('resolves the merchant with an integer balance', async () => {
    const merchant = await getMerchant()
    expect(merchant.name).toBeTruthy()
    expect(Number.isSafeInteger(merchant.balanceKobo)).toBe(true)
  })
})
