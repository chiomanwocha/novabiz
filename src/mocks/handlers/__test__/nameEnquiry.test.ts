import { type Envelope, setupMockServer } from './setupMockServer'

// The real REQUEST_TIMEOUT_MS is 10s — waiting that out for real in every test run
// would make the suite painfully slow. Mocking it small here still exercises the same
// "delay past the timeout constant" code path in the handler, just quickly. vi.mock is
// hoisted above every other statement in this file, so the factory can't reference any
// outer variable — the value is duplicated in `mockTimeoutMs` below for assertions.
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

async function enquire(accountNumber: string, bankCode = '011') {
  const response = await fetch('/api/name-enquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountNumber, bankCode }),
  })
  const body = (await response.json()) as Envelope<NameEnquiryResult | null>
  return { status: response.status, body }
}

describe('POST /api/name-enquiry', () => {
  it('returns 400 for an account number that fails the check digit', async () => {
    const { status, body } = await enquire('1234567890')
    expect(status).toBe(400)
    expect(body.message).toBe('Invalid account number')
  })

  // Account numbers below were generated with generateNuban (lib/nuban.ts), not typed
  // by hand — a hand-typed guess is exactly the kind of typo the check digit exists
  // to catch, first-hand experience of that from the first draft of this file.
  it('returns 404 for an account ending in 0000', async () => {
    const { status, body } = await enquire('0000000000')
    expect(status).toBe(404)
    expect(body.message).toBe('Account not found')
  })

  it("returns 422 for an account ending in 1111 (can't receive funds)", async () => {
    const { status, body } = await enquire('0000021111')
    expect(status).toBe(422)
    expect(body.message).toBe("This account can't receive funds")
  })

  it('resolves a hostile literal name for an account ending in 2222, as plain text', async () => {
    const { status, body } = await enquire('0000042222')
    expect(status).toBe(200)
    expect(body.data?.accountName).toBe('<b>Ade</b><img src=x onerror=alert(1)>')
  })

  it('resolves a very long name for an account ending in 3333', async () => {
    const { status, body } = await enquire('0000063333')
    expect(status).toBe(200)
    expect(body.data?.accountName.length).toBeGreaterThan(50)
  })

  it('resolves the same realistic name for the same account number on repeated calls', async () => {
    const first = await enquire('0102030400')
    const second = await enquire('0102030400')
    expect(first.body.data?.accountName).toBe(second.body.data?.accountName)
    expect(first.body.data?.accountName).toBeTruthy()
  })

  it('gives every successful resolution its own nameEnquiryRef', async () => {
    const first = await enquire('0102030400')
    const second = await enquire('0102030400')
    expect(first.body.data?.nameEnquiryRef).not.toBe(second.body.data?.nameEnquiryRef)
  })

  it('delays past the (mocked) client timeout for an account ending in 9999', async () => {
    const started = Date.now()
    let resolved = false
    const promise = enquire('0000089999').then((result) => {
      resolved = true
      return result
    })

    await new Promise((resolve) => setTimeout(resolve, mockTimeoutMs / 3))
    expect(resolved).toBe(false)

    const { status, body } = await promise
    expect(Date.now() - started).toBeGreaterThanOrEqual(mockTimeoutMs)
    expect(status).toBe(200)
    expect(body.data?.accountName).toBeTruthy()
  })
})
