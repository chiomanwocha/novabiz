import { toKobo } from '../../../lib/money'
import {
  getBanks,
  getMerchant,
  getTransactions,
  getTransferByKey,
  prependTransaction,
  resetStore,
  saveTransfer,
  updateMerchant,
} from '../store'

describe('store', () => {
  beforeEach(() => {
    resetStore(new Date('2026-09-16T12:00:00.000Z').getTime())
  })

  it('starts seeded with a merchant, banks, and 5,000 transactions', () => {
    expect(getMerchant().name).toBeTruthy()
    expect(getBanks().length).toBeGreaterThan(0)
    expect(getTransactions()).toHaveLength(5000)
  })

  it('updateMerchant merges a partial patch', () => {
    const before = getMerchant()
    updateMerchant({ balanceKobo: toKobo(1000) })
    const after = getMerchant()
    expect(after.balanceKobo).toBe(1000)
    expect(after.name).toBe(before.name)
  })

  it('prependTransaction adds the newest transaction to the front of the feed', () => {
    const before = getTransactions().length
    prependTransaction({
      id: 'test-tx-1',
      type: 'debit',
      status: 'pending',
      amountKobo: toKobo(500),
      counterpartyName: 'Test Recipient',
      counterpartyAccountNumber: '0000014579',
      counterpartyBankCode: '011',
      counterpartyBankName: 'First Bank of Nigeria',
      description: 'Test transfer',
      occurredAt: new Date().toISOString(),
    })
    const after = getTransactions()
    expect(after).toHaveLength(before + 1)
    expect(after[0]?.id).toBe('test-tx-1')
  })

  it('saveTransfer and getTransferByKey round-trip by idempotency key', () => {
    expect(getTransferByKey('missing-key')).toBeUndefined()
    saveTransfer({
      idempotencyKey: 'key-1',
      status: 'successful',
      transactionId: 'test-tx-1',
      createdAt: new Date().toISOString(),
    })
    const saved = getTransferByKey('key-1')
    expect(saved?.idempotencyKey).toBe('key-1')
    expect(saved?.status).toBe('successful')
    expect(saved?.transactionId).toBe('test-tx-1')
    expect(typeof saved?.createdAt).toBe('string')
  })

  it('resetStore clears both the transaction feed back to seed data and the transfer map', () => {
    prependTransaction({
      id: 'test-tx-2',
      type: 'credit',
      status: 'successful',
      amountKobo: toKobo(500),
      counterpartyName: 'Test Sender',
      counterpartyAccountNumber: '0000014579',
      counterpartyBankCode: '011',
      counterpartyBankName: 'First Bank of Nigeria',
      description: 'Test',
      occurredAt: new Date().toISOString(),
    })
    saveTransfer({
      idempotencyKey: 'key-2',
      status: 'successful',
      transactionId: 'test-tx-2',
      createdAt: new Date().toISOString(),
    })

    resetStore(new Date('2026-09-16T12:00:00.000Z').getTime())

    expect(getTransactions()).toHaveLength(5000)
    expect(getTransferByKey('key-2')).toBeUndefined()
  })
})
