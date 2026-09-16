import { delay, http } from 'msw'

import { NAME_ENQUIRY_VALID_MS, REQUEST_TIMEOUT_MS } from '../../config/constants'
import { toKobo, type Kobo } from '../../lib/money'
import { getControls, randomLatencyMs, shouldSimulateFailure } from '../controls'
import {
  getMerchant,
  getNameEnquiry,
  getTransferByKey,
  prependTransaction,
  saveTransfer,
  updateMerchant,
} from '../db/store'
import type { Merchant, NameEnquiryRecord } from '../db/types'

import { errorResponse, okResponse } from './envelope'

interface TransferRequestBody {
  accountNumber?: unknown
  bankCode?: unknown
  amountKobo?: unknown
  nameEnquiryRef?: unknown
  narration?: unknown
}

interface ParsedTransferRequest {
  accountNumber: string
  bankCode: string
  amountKobo: Kobo
  nameEnquiryRef: string
  narration: string
}

function parseBody(body: TransferRequestBody): ParsedTransferRequest | null {
  if (
    typeof body.accountNumber !== 'string' ||
    typeof body.bankCode !== 'string' ||
    typeof body.nameEnquiryRef !== 'string' ||
    typeof body.amountKobo !== 'number' ||
    !Number.isSafeInteger(body.amountKobo)
  ) {
    return null
  }
  return {
    accountNumber: body.accountNumber,
    bankCode: body.bankCode,
    amountKobo: toKobo(body.amountKobo),
    nameEnquiryRef: body.nameEnquiryRef,
    narration: typeof body.narration === 'string' ? body.narration.slice(0, 100) : '',
  }
}

function findValidNameEnquiry(request: ParsedTransferRequest): NameEnquiryRecord | null {
  const record = getNameEnquiry(request.nameEnquiryRef)
  if (!record) {
    return null
  }
  if (
    record.accountNumber !== request.accountNumber ||
    record.bankCode !== request.bankCode ||
    Date.now() - record.createdAt > NAME_ENQUIRY_VALID_MS
  ) {
    return null
  }
  return record
}

function validateAmount(amountKobo: Kobo, merchant: Merchant): string | null {
  if (amountKobo <= 0) {
    return 'Enter an amount greater than zero'
  }
  if (amountKobo > merchant.balanceKobo) {
    return 'Amount exceeds your available balance'
  }
  if (amountKobo > merchant.singleTransferLimitKobo) {
    return 'Amount exceeds your single transfer limit'
  }
  if (amountKobo > merchant.dailyLimitKobo - merchant.usedTodayKobo) {
    return 'Amount exceeds your remaining daily limit'
  }
  return null
}

function applyTransfer(request: ParsedTransferRequest, recipientName: string): string {
  const merchant = getMerchant()
  const transactionId = crypto.randomUUID()

  updateMerchant({
    balanceKobo: toKobo(merchant.balanceKobo - request.amountKobo),
    todayOutflowKobo: toKobo(merchant.todayOutflowKobo + request.amountKobo),
    usedTodayKobo: toKobo(merchant.usedTodayKobo + request.amountKobo),
  })

  prependTransaction({
    id: transactionId,
    type: 'debit',
    status: 'successful',
    amountKobo: request.amountKobo,
    counterpartyName: recipientName,
    counterpartyAccountNumber: request.accountNumber,
    counterpartyBankCode: request.bankCode,
    counterpartyBankName: '',
    description: request.narration || 'Transfer',
    occurredAt: new Date().toISOString(),
  })

  return transactionId
}

export const transferHandlers = [
  http.post('/api/transfers', async ({ request }) => {
    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) {
      return errorResponse(400, 'Idempotency-Key header is required')
    }

    // Same key seen before, and it was actually applied: replay the stored result,
    // debit nothing new. Only *applied* transfers are ever saved under a key (see
    // applyTransfer/saveTransfer below) — a validation failure or simulated network
    // failure never blocks a genuine retry with the same key.
    const existing = getTransferByKey(idempotencyKey)
    if (existing) {
      return okResponse(existing)
    }

    const body = (await request.json().catch(() => ({}))) as TransferRequestBody
    const parsed = parseBody(body)
    if (!parsed) {
      return errorResponse(400, 'Invalid transfer request')
    }

    const nameEnquiry = findValidNameEnquiry(parsed)
    if (!nameEnquiry) {
      return errorResponse(422, 'Please confirm the recipient again')
    }

    const merchant = getMerchant()
    if (parsed.accountNumber === merchant.accountNumber && parsed.bankCode === merchant.bankCode) {
      return errorResponse(422, "You can't send money to your own account")
    }

    const amountError = validateAmount(parsed.amountKobo, merchant)
    if (amountError) {
      return errorResponse(422, amountError)
    }

    if (getControls().timeoutMode) {
      // The server applies the transfer for real, then replies after the client will
      // already have given up — "the money moved, the response got lost."
      const transactionId = applyTransfer(parsed, nameEnquiry.accountName)
      const record = {
        idempotencyKey,
        status: 'successful' as const,
        transactionId,
        createdAt: new Date().toISOString(),
      }
      saveTransfer(record)
      await delay(REQUEST_TIMEOUT_MS + 1000)
      return okResponse(record)
    }

    await delay(randomLatencyMs())

    if (shouldSimulateFailure()) {
      // Nothing applied — safe to retry with the same key, since nothing was saved.
      return errorResponse(500, 'The transfer could not be completed. Please try again.')
    }

    const transactionId = applyTransfer(parsed, nameEnquiry.accountName)
    const record = {
      idempotencyKey,
      status: 'successful' as const,
      transactionId,
      createdAt: new Date().toISOString(),
    }
    saveTransfer(record)
    return okResponse(record)
  }),

  http.get('/api/transfers/:idempotencyKey', async ({ params }) => {
    await delay(randomLatencyMs())

    const key = params.idempotencyKey
    const record = typeof key === 'string' ? getTransferByKey(key) : undefined
    if (!record) {
      return errorResponse(404, 'No transfer found for that key')
    }
    return okResponse(record)
  }),
]
