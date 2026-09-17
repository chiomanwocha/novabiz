import { useQueryClient, useMutation, type InfiniteData } from '@tanstack/react-query'
import { useState } from 'react'

import {
  getTransferStatus,
  postTransfer,
  type TransferRequestDto,
} from '../../../api/endpoints/transfers'
import { ApiError } from '../../../api/errors'
import type { MerchantDto, TransactionsPageDto, TransferRecordDto } from '../../../api/types'
import {
  applyOptimisticTransfer,
  markOptimisticRowSuccessful,
  restoreSnapshot,
} from '../logic/optimistic'
import { reconcile, type ReconcileInput } from '../logic/reconcile'
import type { ResolvedAmount } from '../steps/AmountStep'
import type { ResolvedRecipient } from '../steps/RecipientStep'

const MERCHANT_QUERY_KEY = ['merchant']
// Only the unfiltered feed is updated optimistically — a merchant viewing a *filtered*
// dashboard tab mid-send won't see the pending row until onSettled's invalidate corrects
// it moments later. Prepending correctly into every possible filter combination would need
// a client-side re-implementation of the server's own filter matching; not worth it for a
// window that's only ever a few hundred ms wide. Flagged in BUILD_LOG's "Review this".
const TRANSACTIONS_QUERY_KEY = ['transactions', {}]

export interface SendMoneyInput {
  idempotencyKey: string
  recipient: ResolvedRecipient
  amount: ResolvedAmount
}

export type SendMoneyStatus =
  | { state: 'idle' }
  | { state: 'sending' }
  | { state: 'sent' }
  | { state: 'failed'; message: string }
  | { state: 'unconfirmed'; message: string }

interface OptimisticContext {
  merchantSnapshot: MerchantDto | undefined
  transactionsSnapshot: InfiniteData<TransactionsPageDto> | undefined
  tempTransactionId: string
}

function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'network'
}

/** Asks the server what actually happened, for the timeout/network "unknown outcome" branch. */
async function checkTransferStatus(idempotencyKey: string): Promise<ReconcileInput> {
  try {
    const record = await getTransferStatus(idempotencyKey)
    if (record.status === 'successful') {
      return { kind: 'statusConfirmedSuccess' }
    }
    return { kind: 'statusConfirmedFailure', message: record.message }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { kind: 'statusNotFound' }
    }
    return { kind: 'statusCheckFailed' }
  }
}

/**
 * Orchestrates the real send — CLAUDE.md 6.4. The pure decision logic lives in
 * `logic/optimistic.ts` and `logic/reconcile.ts`; this hook's job is cache reads/writes and
 * turning a real `ApiError` into whichever `ReconcileInput` it actually represents.
 *
 * `status` (not TanStack's own `mutation.isError`/`isSuccess`) is what the UI should read —
 * a timeout the server actually applied resolves to `{ state: 'sent' }` here even though the
 * underlying mutation technically rejected, and a genuine failure resolves to `{ state:
 * 'failed' }` with the real message. That distinction is exactly what `reconcile` decides,
 * and TanStack's own success/error split can't represent "rejected, but treat as a success."
 */
export function useSendMoney() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<SendMoneyStatus>({ state: 'idle' })

  const mutation = useMutation<TransferRecordDto, ApiError, SendMoneyInput, OptimisticContext>({
    mutationFn: ({ idempotencyKey, recipient, amount }) => {
      const request: TransferRequestDto = {
        accountNumber: recipient.accountNumber,
        bankCode: recipient.bankCode,
        amountKobo: amount.amountKobo,
        nameEnquiryRef: recipient.nameEnquiryRef,
        narration: amount.narration || undefined,
      }
      return postTransfer(request, idempotencyKey)
    },
    // Never retry a 4xx — only a genuine network failure, and never more than twice. Safe
    // because the idempotency key means a retried request can't ever double-debit.
    retry: (failureCount, error) => failureCount < 2 && isNetworkError(error),
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
    onMutate: async ({ idempotencyKey, recipient, amount }) => {
      setStatus({ state: 'sending' })

      await queryClient.cancelQueries({ queryKey: MERCHANT_QUERY_KEY })
      await queryClient.cancelQueries({ queryKey: TRANSACTIONS_QUERY_KEY })

      const merchantSnapshot = queryClient.getQueryData<MerchantDto>(MERCHANT_QUERY_KEY)
      const transactionsSnapshot =
        queryClient.getQueryData<InfiniteData<TransactionsPageDto>>(TRANSACTIONS_QUERY_KEY)
      const tempTransactionId = `optimistic-${idempotencyKey}`

      if (merchantSnapshot && transactionsSnapshot) {
        const updated = applyOptimisticTransfer({
          merchant: merchantSnapshot,
          transactionPages: transactionsSnapshot,
          amountKobo: amount.amountKobo,
          narration: amount.narration,
          recipient,
          tempTransactionId,
          occurredAt: new Date().toISOString(),
        })
        queryClient.setQueryData(MERCHANT_QUERY_KEY, updated.merchant)
        queryClient.setQueryData(TRANSACTIONS_QUERY_KEY, updated.transactionPages)
      }

      return { merchantSnapshot, transactionsSnapshot, tempTransactionId }
    },
    onSuccess: (record, _input, context) => {
      const transactionsSnapshot =
        queryClient.getQueryData<InfiniteData<TransactionsPageDto>>(TRANSACTIONS_QUERY_KEY)
      if (transactionsSnapshot) {
        queryClient.setQueryData(
          TRANSACTIONS_QUERY_KEY,
          markOptimisticRowSuccessful(
            transactionsSnapshot,
            context.tempTransactionId,
            record.transactionId,
          ),
        )
      }
      setStatus({ state: 'sent' })
    },
    onError: async (error, { idempotencyKey }, context) => {
      const reconcileInput: ReconcileInput =
        error.kind === 'timeout' || error.kind === 'network'
          ? await checkTransferStatus(idempotencyKey)
          : { kind: 'http', message: error.message }

      const action = reconcile(reconcileInput)

      if (action.kind === 'keep') {
        const transactionsSnapshot =
          queryClient.getQueryData<InfiniteData<TransactionsPageDto>>(TRANSACTIONS_QUERY_KEY)
        if (transactionsSnapshot && context) {
          // No server-generated id reached the client (that's the whole reason this is the
          // timeout branch) — the temp id is the only one there is, so it becomes permanent
          // until onSettled's refetch replaces this row with the server's real one anyway.
          queryClient.setQueryData(
            TRANSACTIONS_QUERY_KEY,
            markOptimisticRowSuccessful(
              transactionsSnapshot,
              context.tempTransactionId,
              context.tempTransactionId,
            ),
          )
        }
        setStatus({ state: 'sent' })
        return
      }

      if (context) {
        const restored = restoreSnapshot({
          merchant: context.merchantSnapshot,
          transactionPages: context.transactionsSnapshot,
        })
        if (restored.merchant) {
          queryClient.setQueryData(MERCHANT_QUERY_KEY, restored.merchant)
        }
        if (restored.transactionPages) {
          queryClient.setQueryData(TRANSACTIONS_QUERY_KEY, restored.transactionPages)
        }
      }

      setStatus(
        action.kind === 'restoreUnconfirmed'
          ? { state: 'unconfirmed', message: action.message }
          : { state: 'failed', message: action.message },
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: MERCHANT_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  return {
    send: (input: SendMoneyInput) => {
      mutation.mutate(input)
    },
    status,
  }
}
