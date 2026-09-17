import type { InfiniteData } from '@tanstack/react-query'

import type { MerchantDto, TransactionDto, TransactionsPageDto } from '../../../api/types'
import { sumKobo, toKobo, type Kobo } from '../../../lib/money'

export interface OptimisticRecipient {
  accountNumber: string
  bankCode: string
  bankName: string
  accountName: string
}

export interface ApplyOptimisticTransferInput {
  merchant: MerchantDto
  transactionPages: InfiniteData<TransactionsPageDto>
  amountKobo: Kobo
  narration: string
  recipient: OptimisticRecipient
  /** Tied to the idempotency key, so the row can be found again once the server confirms it. */
  tempTransactionId: string
  occurredAt: string
}

export interface OptimisticTransferResult {
  merchant: MerchantDto
  transactionPages: InfiniteData<TransactionsPageDto>
}

/**
 * Subtracts the amount from the balance, adds it to today's outflow, and prepends a
 * `pending` row with a temp id tied to the idempotency key — CLAUDE.md 6.4. Never mutates
 * its inputs; every object returned is a new one, so a snapshot taken before calling this
 * stays perfectly valid to hand straight to `restoreSnapshot` afterwards.
 */
export function applyOptimisticTransfer(
  input: ApplyOptimisticTransferInput,
): OptimisticTransferResult {
  const {
    merchant,
    transactionPages,
    amountKobo,
    narration,
    recipient,
    tempTransactionId,
    occurredAt,
  } = input

  const updatedMerchant: MerchantDto = {
    ...merchant,
    balanceKobo: toKobo(merchant.balanceKobo - amountKobo),
    todayOutflowKobo: sumKobo([merchant.todayOutflowKobo, amountKobo]),
  }

  const pendingRow: TransactionDto = {
    id: tempTransactionId,
    type: 'debit',
    status: 'pending',
    amountKobo,
    counterpartyName: recipient.accountName,
    counterpartyAccountNumber: recipient.accountNumber,
    counterpartyBankCode: recipient.bankCode,
    counterpartyBankName: recipient.bankName,
    description: narration,
    occurredAt,
  }

  const [firstPage, ...restPages] = transactionPages.pages
  const updatedFirstPage: TransactionsPageDto = {
    nextCursor: firstPage?.nextCursor ?? null,
    transactions: [pendingRow, ...(firstPage?.transactions ?? [])],
    // The optimistic row is a real addition to the (unfiltered) total too, so the "X of Y"
    // count stays accurate immediately rather than lagging until onSettled's refetch.
    total: (firstPage?.total ?? 0) + 1,
  }

  return {
    merchant: updatedMerchant,
    transactionPages: {
      ...transactionPages,
      pages: [updatedFirstPage, ...restPages],
    },
  }
}

/**
 * Undoes an optimistic transfer by handing back the exact snapshot taken before it was
 * applied. Trivial by design — the interesting guarantee lives in `applyOptimisticTransfer`
 * never mutating its inputs, which is what makes the pre-apply snapshot still valid here.
 */
export function restoreSnapshot<T>(snapshot: T): T {
  return snapshot
}

/**
 * Once the server confirms the transfer, the optimistic row's id and status are swapped
 * for the real ones — everything else (amount, counterparty, narration) was already
 * correct, since it's exactly what was submitted. `onSettled`'s invalidate-and-refetch
 * fills in the rest (the server's own timestamp, etc.) shortly after.
 */
export function markOptimisticRowSuccessful(
  transactionPages: InfiniteData<TransactionsPageDto>,
  tempTransactionId: string,
  serverTransactionId: string,
): InfiniteData<TransactionsPageDto> {
  return {
    ...transactionPages,
    pages: transactionPages.pages.map((page) => ({
      ...page,
      transactions: page.transactions.map((transaction) =>
        transaction.id === tempTransactionId
          ? { ...transaction, id: serverTransactionId, status: 'successful' as const }
          : transaction,
      ),
    })),
  }
}
