import type { Kobo } from '../../lib/money'

export type KycTier = 1 | 2 | 3

export interface Merchant {
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

export interface Bank {
  code: string
  name: string
}

export type TransactionType = 'credit' | 'debit'
export type TransactionStatus = 'pending' | 'successful' | 'failed'

export interface Transaction {
  id: string
  type: TransactionType
  status: TransactionStatus
  amountKobo: Kobo
  counterpartyName: string
  /** Unmasked. Masking happens at the API response boundary, same as money formatting. */
  counterpartyAccountNumber: string
  counterpartyBankCode: string
  counterpartyBankName: string
  description: string
  /** ISO 8601 timestamp. */
  occurredAt: string
}

export interface TransferRecord {
  idempotencyKey: string
  status: 'successful' | 'failed'
  transactionId: string
  /** Present when status is 'failed' — the reason shown to the user. */
  message?: string
  createdAt: string
}

/** A resolved name-enquiry result, kept just long enough to back a transfer's nameEnquiryRef check. */
export interface NameEnquiryRecord {
  ref: string
  accountNumber: string
  bankCode: string
  accountName: string
  createdAt: number
}

export interface SeedData {
  merchant: Merchant
  banks: Bank[]
  transactions: Transaction[]
}

export interface WeekOverWeekInsight {
  thisWeekInflowKobo: Kobo
  lastWeekInflowKobo: Kobo
}

export interface TopPayerInsight {
  name: string
  totalKobo: Kobo
  transactionCount: number
}

export interface BusiestDayInsight {
  dayLabel: string
  transactionCount: number
}

export interface MerchantInsights {
  weekOverWeek: WeekOverWeekInsight
  topPayer: TopPayerInsight | null
  busiestDay: BusiestDayInsight | null
  /** Average credit amount over the last 30 days, `null` when there's no recent credit to average. */
  averageSaleKobo: Kobo | null
}
