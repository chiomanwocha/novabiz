import type { Kobo } from '../lib/money'

export type KycTier = 1 | 2 | 3

export interface MerchantDto {
  name: string
  accountNumber: string
  bankCode: string
  balanceKobo: Kobo
  todayInflowKobo: Kobo
  todayOutflowKobo: Kobo
  kycTier: KycTier
  singleTransferLimitKobo: Kobo
  dailyLimitKobo: Kobo
  usedTodayKobo: Kobo
}

export interface BankDto {
  code: string
  name: string
}

export type TransactionType = 'credit' | 'debit'
export type TransactionStatus = 'pending' | 'successful' | 'failed'

export interface TransactionDto {
  id: string
  type: TransactionType
  status: TransactionStatus
  amountKobo: Kobo
  counterpartyName: string
  counterpartyAccountNumber: string
  counterpartyBankCode: string
  counterpartyBankName: string
  description: string
  /** ISO 8601 timestamp. */
  occurredAt: string
}

export interface TransactionsPageDto {
  transactions: TransactionDto[]
  nextCursor: string | null
  /** Count of every transaction matching the current filters, not just this page — lets the UI show "X of Y loaded". */
  total: number
}

export interface NameEnquiryResponseDto {
  accountName: string
  nameEnquiryRef: string
}

export interface TransferRecordDto {
  idempotencyKey: string
  status: 'successful' | 'failed'
  transactionId: string
  /** Present when status is 'failed' — the reason shown to the user. */
  message?: string
  createdAt: string
}

export interface MerchantInsightsDto {
  weekOverWeek: {
    thisWeekInflowKobo: Kobo
    lastWeekInflowKobo: Kobo
  }
  topPayer: { name: string; totalKobo: Kobo; transactionCount: number } | null
  busiestDay: { dayLabel: string; transactionCount: number } | null
  averageSaleKobo: Kobo | null
}
