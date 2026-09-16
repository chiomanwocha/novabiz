import { toKobo } from '../../../lib/money'
import { setupMockServer } from '../../../mocks/handlers/__test__/setupMockServer'
import { postNameEnquiry } from '../nameEnquiry'
import { getTransferStatus, postTransfer } from '../transfers'

setupMockServer()

const RECIPIENT_ACCOUNT_NUMBER = '0102030400'
const RECIPIENT_BANK_CODE = '011'

async function resolveRecipientRef(): Promise<string> {
  const { nameEnquiryRef } = await postNameEnquiry({
    accountNumber: RECIPIENT_ACCOUNT_NUMBER,
    bankCode: RECIPIENT_BANK_CODE,
  })
  return nameEnquiryRef
}

describe('postTransfer', () => {
  it('sends the Idempotency-Key header and completes a transfer', async () => {
    const nameEnquiryRef = await resolveRecipientRef()
    const key = crypto.randomUUID()

    const result = await postTransfer(
      {
        accountNumber: RECIPIENT_ACCOUNT_NUMBER,
        bankCode: RECIPIENT_BANK_CODE,
        amountKobo: toKobo(5000),
        nameEnquiryRef,
      },
      key,
    )

    expect(result.status).toBe('successful')
    expect(result.idempotencyKey).toBe(key)
  })

  it('rejects with a typed 422 ApiError for a stale or unknown nameEnquiryRef', async () => {
    await expect(
      postTransfer(
        {
          accountNumber: RECIPIENT_ACCOUNT_NUMBER,
          bankCode: RECIPIENT_BANK_CODE,
          amountKobo: toKobo(5000),
          nameEnquiryRef: 'not-a-real-ref',
        },
        crypto.randomUUID(),
      ),
    ).rejects.toMatchObject({ kind: 'http', status: 422 })
  })
})

describe('getTransferStatus', () => {
  it('fetches the stored transfer back by idempotency key', async () => {
    const nameEnquiryRef = await resolveRecipientRef()
    const key = crypto.randomUUID()
    await postTransfer(
      {
        accountNumber: RECIPIENT_ACCOUNT_NUMBER,
        bankCode: RECIPIENT_BANK_CODE,
        amountKobo: toKobo(5000),
        nameEnquiryRef,
      },
      key,
    )

    const status = await getTransferStatus(key)
    expect(status.idempotencyKey).toBe(key)
    expect(status.status).toBe('successful')
  })

  it('rejects with a typed 404 ApiError for a key the server never received', async () => {
    await expect(getTransferStatus('never-seen-key')).rejects.toMatchObject({
      kind: 'http',
      status: 404,
    })
  })
})
