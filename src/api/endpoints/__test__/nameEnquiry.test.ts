import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { postNameEnquiry } from '../nameEnquiry'

setupMockServer()

describe('postNameEnquiry', () => {
  it('resolves a name and ref for a valid account number', async () => {
    const result = await postNameEnquiry({ accountNumber: '0102030400', bankCode: '011' })
    expect(result.accountName).toBeTruthy()
    expect(result.nameEnquiryRef).toBeTruthy()
  })

  it('rejects with a typed ApiError for an account that fails the check digit', async () => {
    await expect(
      postNameEnquiry({ accountNumber: '1234567890', bankCode: '011' }),
    ).rejects.toMatchObject({ kind: 'http', status: 400 })
  })
})
