import { sumKobo, toKobo, type Kobo } from '../../lib/money'
import { generateNuban } from '../../lib/nuban'

import { FIRST_NAMES, HOSTILE_DESCRIPTIONS, LAST_NAMES, NARRATIONS } from './names'
import {
  createSeededRandom,
  pick,
  randomInt,
  randomSerial9,
  weightedPick,
  type SeededRandom,
} from './seededRandom'
import type {
  Bank,
  Merchant,
  SeedData,
  Transaction,
  TransactionStatus,
  TransactionType,
} from './types'

/** Fixed seed: every run of the app generates the exact same 5,000 transactions. */
const SEED = 20260916
const TRANSACTION_COUNT = 5000
const DAYS_SPAN = 60

export const MOCK_BANKS: readonly Bank[] = [
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '032', name: 'Union Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
]

const MERCHANT_BANK_CODE = '058'
const MERCHANT_NAME = "Amaka's Provisions Store"

function randomName(random: SeededRandom): string {
  return `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`
}

const AMOUNT_RANGES_NAIRA: Record<'small' | 'medium' | 'large', readonly [number, number]> = {
  small: [200, 10_000],
  medium: [10_000, 40_000],
  large: [40_000, 150_000],
}

function randomAmountKobo(random: SeededRandom): Kobo {
  const tier = weightedPick(random, [
    ['small', 70],
    ['medium', 25],
    ['large', 5],
  ] as const)
  const [min, max] = AMOUNT_RANGES_NAIRA[tier]
  return toKobo(randomInt(random, min, max) * 100)
}

function randomStatus(random: SeededRandom): TransactionStatus {
  return weightedPick(random, [
    ['successful', 85],
    ['failed', 10],
    ['pending', 5],
  ] as const)
}

function randomType(random: SeededRandom): TransactionType {
  return weightedPick(random, [
    ['credit', 55],
    ['debit', 45],
  ] as const)
}

function randomOccurredAt(random: SeededRandom, now: number): { occurredAt: string } {
  const dayOffset = randomInt(random, 0, DAYS_SPAN - 1)
  const secondsIntoDay = randomInt(random, 0, 86_399)
  const occurredAt = new Date(now - dayOffset * 86_400_000 - secondsIntoDay * 1000).toISOString()
  return { occurredAt }
}

function buildTransaction(
  random: SeededRandom,
  now: number,
  index: number,
  forcedDescription?: string,
): Transaction {
  const bank = pick(random, MOCK_BANKS)
  const accountNumber = generateNuban(bank.code, randomSerial9(random))
  const { occurredAt } = randomOccurredAt(random, now)

  return {
    // Deterministic, not crypto.randomUUID() — the whole point of seeded random
    // generation is that generateSeed(now) is byte-identical across calls, and a real
    // random UUID would silently break that on every single transaction.
    id: `seed-${String(index).padStart(4, '0')}`,
    type: randomType(random),
    status: randomStatus(random),
    amountKobo: randomAmountKobo(random),
    counterpartyName: randomName(random),
    counterpartyAccountNumber: accountNumber,
    counterpartyBankCode: bank.code,
    counterpartyBankName: bank.name,
    description: forcedDescription ?? pick(random, NARRATIONS),
    occurredAt,
  }
}

function buildMerchant(bank: Bank, transactions: readonly Transaction[], now: number): Merchant {
  const todaysSuccessful = transactions.filter(
    (transaction) => isToday(transaction.occurredAt, now) && transaction.status === 'successful',
  )
  const todayInflowKobo = sumKobo(
    todaysSuccessful.filter((t) => t.type === 'credit').map((t) => t.amountKobo),
  )
  const todayOutflowKobo = sumKobo(
    todaysSuccessful.filter((t) => t.type === 'debit').map((t) => t.amountKobo),
  )

  return {
    name: MERCHANT_NAME,
    accountNumber: generateNuban(bank.code, '000900001'),
    bankCode: bank.code,
    balanceKobo: toKobo(31_450_075),
    todayInflowKobo,
    todayOutflowKobo,
    kycTier: 2,
    singleTransferLimitKobo: toKobo(500_000),
    dailyLimitKobo: toKobo(2_000_000),
    // Deliberately NOT derived from todayOutflowKobo: that figure is the dashboard's
    // "today's outflow" summary over the whole seeded historical feed (any kind of
    // debit), while usedTodayKobo tracks only what's been sent today specifically
    // through this app's Send Money flow — a different, smaller, independently
    // tracked number. Seeded with modest headroom so a live demo send doesn't
    // immediately trip the daily limit.
    usedTodayKobo: toKobo(300_000),
  }
}

// Local calendar day, not UTC — "today" should match what a merchant sees on their own
// device's clock, and must be compared against the same `now` the transactions were
// generated relative to (not the real wall clock), so this stays deterministic in tests.
function isToday(isoTimestamp: string, now: number): boolean {
  return new Date(isoTimestamp).toDateString() === new Date(now).toDateString()
}

/**
 * Generates the deterministic seed dataset: a merchant, the mock bank list, and 5,000
 * transactions (newest first) spread across the last 60 days. Every call with the same
 * `now` produces byte-identical output — only the seeded random generator drives
 * "randomness".
 */
export function generateSeed(now: number = Date.now()): SeedData {
  const random = createSeededRandom(SEED)

  // Guarantee all 5 hostile descriptions appear, spread evenly through the dataset,
  // rather than leaving their inclusion to chance.
  const hostileSlotSize = Math.floor(TRANSACTION_COUNT / HOSTILE_DESCRIPTIONS.length)
  const hostileSlots = new Map(
    HOSTILE_DESCRIPTIONS.map((description, index) => [index * hostileSlotSize, description]),
  )

  const transactions = Array.from({ length: TRANSACTION_COUNT }, (_, index) =>
    buildTransaction(random, now, index, hostileSlots.get(index)),
  ).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))

  const merchantBank = MOCK_BANKS.find((bank) => bank.code === MERCHANT_BANK_CODE)
  if (!merchantBank) {
    throw new Error(`Merchant bank code ${MERCHANT_BANK_CODE} not found in MOCK_BANKS`)
  }

  return {
    merchant: buildMerchant(merchantBank, transactions, now),
    banks: [...MOCK_BANKS],
    transactions,
  }
}
