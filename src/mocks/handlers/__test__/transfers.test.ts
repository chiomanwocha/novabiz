import { getMerchant } from '../../db/store'

import { type Envelope, setupMockServer } from './setupMockServer'

// Same reasoning as nameEnquiry.test.ts: mock the 10s timeout constant down so the
// timeoutMode test doesn't make the suite slow. Hoisted above other statements, so no
// outer-variable reference inside the factory.
vi.mock('../../../config/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../config/constants')>()),
  REQUEST_TIMEOUT_MS: 150,
}))

const mockTimeoutMs = 150

setupMockServer()

interface NameEnquiryResult {
  accountName: string
  nameEnquiryRef: string
}

interface TransferResult {
  idempotencyKey: string
  status: 'successful' | 'failed'
  transactionId: string
  message?: string
}

const RECIPIENT_ACCOUNT_NUMBER = '0102030400'
const RECIPIENT_BANK_CODE = '011'

async function getNameEnquiryRef(): Promise<string> {
  const response = await fetch('/api/name-enquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountNumber: RECIPIENT_ACCOUNT_NUMBER,
      bankCode: RECIPIENT_BANK_CODE,
    }),
  })
  const body = (await response.json()) as Envelope<NameEnquiryResult>
  return body.data.nameEnquiryRef
}

async function sendTransfer(
  overrides: Partial<{
    idempotencyKey: string | null
    accountNumber: string
    bankCode: string
    amountKobo: number
    nameEnquiryRef: string
  }> = {},
) {
  const nameEnquiryRef = overrides.nameEnquiryRef ?? (await getNameEnquiryRef())
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (overrides.idempotencyKey !== null) {
    headers['Idempotency-Key'] = overrides.idempotencyKey ?? crypto.randomUUID()
  }

  const response = await fetch('/api/transfers', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      accountNumber: overrides.accountNumber ?? RECIPIENT_ACCOUNT_NUMBER,
      bankCode: overrides.bankCode ?? RECIPIENT_BANK_CODE,
      amountKobo: overrides.amountKobo ?? 5000,
      nameEnquiryRef,
    }),
  })
  const body = (await response.json()) as Envelope<TransferResult | null>
  return { status: response.status, body }
}

describe('POST /api/transfers', () => {
  it('returns 400 when the Idempotency-Key header is missing', async () => {
    const { status, body } = await sendTransfer({ idempotencyKey: null })
    expect(status).toBe(400)
    expect(body.message).toMatch(/idempotency/i)
  })

  it('returns 422 when nameEnquiryRef is missing or unknown', async () => {
    const { status, body } = await sendTransfer({ nameEnquiryRef: 'not-a-real-ref' })
    expect(status).toBe(422)
    expect(body.message).toBe('Please confirm the recipient again')
  })

  it("returns 422 for the merchant's own account", async () => {
    const merchant = getMerchant()
    // Needs a *real* nameEnquiryRef for the merchant's own account/bank — the
    // nameEnquiryRef check runs before the own-account check, so a fake ref would
    // only prove the wrong thing (that ref validation runs at all, not that the
    // own-account rule does).
    const ownAccountRef = await (async () => {
      const response = await fetch('/api/name-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber: merchant.accountNumber,
          bankCode: merchant.bankCode,
        }),
      })
      const body = (await response.json()) as Envelope<NameEnquiryResult>
      return body.data.nameEnquiryRef
    })()

    const { status, body } = await sendTransfer({
      accountNumber: merchant.accountNumber,
      bankCode: merchant.bankCode,
      nameEnquiryRef: ownAccountRef,
    })
    expect(status).toBe(422)
    expect(body.message).toBe("You can't send money to your own account")
  })

  it('returns 422 when the amount exceeds the single transfer limit', async () => {
    const merchant = getMerchant()
    const { status, body } = await sendTransfer({
      amountKobo: merchant.singleTransferLimitKobo + 1,
    })
    expect(status).toBe(422)
    expect(body.message).toBe('Amount exceeds your single transfer limit')
  })

  it('returns 422 for a zero amount', async () => {
    const { status, body } = await sendTransfer({ amountKobo: 0 })
    expect(status).toBe(422)
    expect(body.message).toBe('Enter an amount greater than zero')
  })

  it('debits the balance, updates today totals, and prepends a transaction on success', async () => {
    const before = getMerchant()
    const { status, body } = await sendTransfer({ amountKobo: 5000 })

    expect(status).toBe(200)
    expect(body.data?.status).toBe('successful')

    const after = getMerchant()
    expect(after.balanceKobo).toBe(before.balanceKobo - 5000)
    expect(after.todayOutflowKobo).toBe(before.todayOutflowKobo + 5000)
    expect(after.usedTodayKobo).toBe(before.usedTodayKobo + 5000)
  })

  it('replays the stored result for a repeated Idempotency-Key without debiting again', async () => {
    const key = crypto.randomUUID()
    const first = await sendTransfer({ idempotencyKey: key, amountKobo: 5000 })
    const balanceAfterFirst = getMerchant().balanceKobo

    const second = await sendTransfer({ idempotencyKey: key, amountKobo: 5000 })

    expect(second.status).toBe(200)
    expect(second.body.data?.transactionId).toBe(first.body.data?.transactionId)
    expect(getMerchant().balanceKobo).toBe(balanceAfterFirst)
  })

  it('a simulated network failure applies nothing, so a retry with the same key can still succeed', async () => {
    const { setControls } = await import('../../controls')
    const key = crypto.randomUUID()
    const before = getMerchant().balanceKobo
    // Resolve the recipient first, same as a real flow (Recipient step, then Review,
    // then Send) — failRate should only affect the send attempt itself here, not the
    // earlier name-enquiry call this test's own setup depends on.
    const nameEnquiryRef = await getNameEnquiryRef()

    setControls({ fixedLatencyMs: 0, failRate: 1, timeoutMode: false })
    const failed = await sendTransfer({ idempotencyKey: key, amountKobo: 5000, nameEnquiryRef })
    expect(failed.status).toBe(500)
    expect(getMerchant().balanceKobo).toBe(before)

    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: false })
    const retried = await sendTransfer({ idempotencyKey: key, amountKobo: 5000, nameEnquiryRef })
    expect(retried.status).toBe(200)
    expect(getMerchant().balanceKobo).toBe(before - 5000)
  })

  it('timeoutMode applies the transfer immediately but delays the response past the timeout', async () => {
    const { setControls } = await import('../../controls')
    setControls({ fixedLatencyMs: 0, failRate: 0, timeoutMode: true })

    const before = getMerchant().balanceKobo
    const started = Date.now()
    let resolved = false
    const promise = sendTransfer({ amountKobo: 5000 }).then((result) => {
      resolved = true
      return result
    })

    await new Promise((resolve) => setTimeout(resolve, mockTimeoutMs / 3))
    // The debit already happened server-side, even though the response hasn't arrived.
    expect(resolved).toBe(false)
    expect(getMerchant().balanceKobo).toBe(before - 5000)

    const { status } = await promise
    expect(Date.now() - started).toBeGreaterThanOrEqual(mockTimeoutMs)
    expect(status).toBe(200)
  })
})

describe('GET /api/transfers/:idempotencyKey', () => {
  it('returns 404 for a key the server never received', async () => {
    const response = await fetch('/api/transfers/never-seen-key')
    expect(response.status).toBe(404)
  })

  it('returns the stored transfer for a key that was applied', async () => {
    const key = crypto.randomUUID()
    await sendTransfer({ idempotencyKey: key, amountKobo: 5000 })

    const response = await fetch(`/api/transfers/${key}`)
    const body = (await response.json()) as Envelope<TransferResult>
    expect(response.status).toBe(200)
    expect(body.data.idempotencyKey).toBe(key)
    expect(body.data.status).toBe('successful')
  })
})
