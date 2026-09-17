import { z } from 'zod'

import type { Kobo } from '../../../lib/money'
import { parseNairaToKobo } from '../../../lib/money'
import { sendMoneyCopy } from '../copy'

const NARRATION_MAX_LENGTH = 100

export interface AmountLimits {
  balanceKobo: Kobo
  singleTransferLimitKobo: Kobo
  remainingDailyLimitKobo: Kobo
}

export interface AmountFormValues {
  amountNaira: string
  narration: string
}

/**
 * One schema per Send Money step, per CLAUDE.md 3.6 — this one checks the amount against
 * the merchant's own balance and limits, so it's built fresh from whatever `useMerchant`
 * returns rather than being a static export. Parsing goes through `parseNairaToKobo`
 * (never `parseFloat`), and the checks are ordered most-fundamental-first (a real number,
 * then balance, then per-transfer limit, then remaining daily limit) so only the single
 * most relevant message ever shows.
 */
export function createAmountSchema(limits: AmountLimits) {
  return z
    .object({
      amountNaira: z.string(),
      narration: z.string().max(NARRATION_MAX_LENGTH, sendMoneyCopy.amountErrors.narrationTooLong),
    })
    .superRefine((value, ctx) => {
      const kobo = parseNairaToKobo(value.amountNaira)
      if (kobo === null || kobo <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['amountNaira'],
          message: sendMoneyCopy.amountErrors.invalid,
        })
        return
      }
      if (kobo > limits.balanceKobo) {
        ctx.addIssue({
          code: 'custom',
          path: ['amountNaira'],
          message: sendMoneyCopy.amountErrors.overBalance,
        })
        return
      }
      if (kobo > limits.singleTransferLimitKobo) {
        ctx.addIssue({
          code: 'custom',
          path: ['amountNaira'],
          message: sendMoneyCopy.amountErrors.overSingleLimit,
        })
        return
      }
      if (kobo > limits.remainingDailyLimitKobo) {
        ctx.addIssue({
          code: 'custom',
          path: ['amountNaira'],
          message: sendMoneyCopy.amountErrors.overDailyLimit,
        })
      }
    })
}
