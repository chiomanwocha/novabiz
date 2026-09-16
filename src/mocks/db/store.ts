import { generateSeed } from './seed'
import type {
  Bank,
  Merchant,
  NameEnquiryRecord,
  SeedData,
  Transaction,
  TransferRecord,
} from './types'

let state: SeedData = generateSeed()
let transfersByKey = new Map<string, TransferRecord>()
let nameEnquiriesByRef = new Map<string, NameEnquiryRecord>()

export function resetStore(now?: number): void {
  state = generateSeed(now)
  transfersByKey = new Map()
  nameEnquiriesByRef = new Map()
}

export function getMerchant(): Merchant {
  return state.merchant
}

export function updateMerchant(patch: Partial<Merchant>): Merchant {
  state.merchant = { ...state.merchant, ...patch }
  return state.merchant
}

export function getBanks(): readonly Bank[] {
  return state.banks
}

export function getTransactions(): readonly Transaction[] {
  return state.transactions
}

/** Adds a transaction at the front of the feed (newest first) — used for a just-sent transfer. */
export function prependTransaction(transaction: Transaction): void {
  state.transactions = [transaction, ...state.transactions]
}

export function getTransferByKey(idempotencyKey: string): TransferRecord | undefined {
  return transfersByKey.get(idempotencyKey)
}

export function saveTransfer(record: TransferRecord): void {
  transfersByKey.set(record.idempotencyKey, record)
}

export function getNameEnquiry(ref: string): NameEnquiryRecord | undefined {
  return nameEnquiriesByRef.get(ref)
}

export function saveNameEnquiry(record: NameEnquiryRecord): void {
  nameEnquiriesByRef.set(record.ref, record)
}
