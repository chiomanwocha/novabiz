import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { getBanks } from '../banks'

setupMockServer()

describe('getBanks', () => {
  it('resolves a non-empty list of { code, name } banks', async () => {
    const banks = await getBanks()
    expect(banks.length).toBeGreaterThan(0)
    const [first] = banks
    expect(typeof first?.code).toBe('string')
    expect(typeof first?.name).toBe('string')
  })
})
