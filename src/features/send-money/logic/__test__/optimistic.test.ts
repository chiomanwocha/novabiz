import type { InfiniteData } from '@tanstack/react-query'

import type { MerchantDto, TransactionsPageDto } from '../../../../api/types'
import { toKobo } from '../../../../lib/money'
import {
  applyOptimisticTransfer,
  markOptimisticRowSuccessful,
  restoreSnapshot,
  type ApplyOptimisticTransferInput,
} from '../optimistic'

const MERCHANT: MerchantDto = {
  name: 'Amaka Provisions',
  accountNumber: '0011223344',
  bankCode: '011',
  balanceKobo: toKobo(31_450_075),
  todayInflowKobo: toKobo(0),
  todayOutflowKobo: toKobo(50_000),
  kycTier: 2,
  singleTransferLimitKobo: toKobo(500_000),
  dailyLimitKobo: toKobo(2_000_000),
  usedTodayKobo: toKobo(300_000),
}

const TRANSACTION_PAGES: InfiniteData<TransactionsPageDto> = {
  pages: [
    {
      transactions: [
        {
          id: 'txn-1',
          type: 'credit',
          status: 'successful',
          amountKobo: toKobo(20_000),
          counterpartyName: 'Chidi Eze',
          counterpartyAccountNumber: '0099887766',
          counterpartyBankCode: '058',
          counterpartyBankName: 'GTBank',
          description: 'Stock payment',
          occurredAt: '2026-09-16T10:00:00.000Z',
        },
      ],
      nextCursor: 'cursor-1',
      total: 1,
    },
  ],
  pageParams: [null],
}

function buildInput(
  overrides: Partial<ApplyOptimisticTransferInput> = {},
): ApplyOptimisticTransferInput {
  return {
    merchant: MERCHANT,
    transactionPages: TRANSACTION_PAGES,
    amountKobo: toKobo(100_050),
    narration: 'Stock top-up',
    recipient: {
      accountNumber: '0102030400',
      bankCode: '011',
      bankName: 'First Bank of Nigeria',
      accountName: 'Ngozi Adeyemi',
    },
    tempTransactionId: 'optimistic-key-1',
    occurredAt: '2026-09-17T09:00:00.000Z',
    ...overrides,
  }
}

describe('applyOptimisticTransfer', () => {
  it("subtracts the amount from the balance and adds it to today's outflow", () => {
    const result = applyOptimisticTransfer(buildInput())

    expect(result.merchant.balanceKobo).toBe(31_450_075 - 100_050)
    expect(result.merchant.todayOutflowKobo).toBe(50_000 + 100_050)
  })

  it('prepends a pending row with the temp id and the submitted details', () => {
    const result = applyOptimisticTransfer(buildInput())
    const firstPage = result.transactionPages.pages[0]

    expect(firstPage?.transactions[0]).toMatchObject({
      id: 'optimistic-key-1',
      status: 'pending',
      type: 'debit',
      amountKobo: 100_050,
      counterpartyName: 'Ngozi Adeyemi',
      counterpartyBankCode: '011',
    })
    expect(firstPage?.transactions).toHaveLength(2)
    expect(firstPage?.transactions[1]?.id).toBe('txn-1')
    // The "X of Y" count reflects the optimistic row immediately, not just after the
    // server confirms it and onSettled refetches.
    expect(firstPage?.total).toBe(2)
  })

  it('does not mutate its inputs', () => {
    const originalMerchant = { ...MERCHANT }
    const originalFirstPageLength = TRANSACTION_PAGES.pages[0]?.transactions.length

    applyOptimisticTransfer(buildInput())

    expect(MERCHANT).toEqual(originalMerchant)
    expect(TRANSACTION_PAGES.pages[0]?.transactions).toHaveLength(originalFirstPageLength ?? 0)
  })
})

describe('restoreSnapshot', () => {
  it('apply then restore gives back the exact original cache', () => {
    const snapshot = { merchant: MERCHANT, transactionPages: TRANSACTION_PAGES }

    applyOptimisticTransfer(buildInput())
    const restored = restoreSnapshot(snapshot)

    expect(restored.merchant).toBe(MERCHANT)
    expect(restored.transactionPages).toBe(TRANSACTION_PAGES)
    expect(restored.merchant.balanceKobo).toBe(31_450_075)
  })
})

describe('markOptimisticRowSuccessful', () => {
  it("swaps the matching row's id and status, leaving other rows untouched", () => {
    const { transactionPages } = applyOptimisticTransfer(buildInput())

    const result = markOptimisticRowSuccessful(
      transactionPages,
      'optimistic-key-1',
      'server-txn-99',
    )
    const firstPage = result.pages[0]

    expect(firstPage?.transactions[0]).toMatchObject({ id: 'server-txn-99', status: 'successful' })
    expect(firstPage?.transactions[1]).toMatchObject({ id: 'txn-1', status: 'successful' })
  })

  it('leaves the pages untouched if no row matches the temp id', () => {
    const result = markOptimisticRowSuccessful(TRANSACTION_PAGES, 'no-such-id', 'server-txn-99')

    expect(result.pages[0]?.transactions).toEqual(TRANSACTION_PAGES.pages[0]?.transactions)
  })
})
