import { delay, http } from 'msw'

import { REQUEST_TIMEOUT_MS } from '../../config/constants'
import { isValidNubanCheckDigit } from '../../lib/nuban'
import { randomLatencyMs, shouldSimulateFailure } from '../controls'
import { FIRST_NAMES, LAST_NAMES } from '../db/names'
import { saveNameEnquiry } from '../db/store'

import { errorResponse, okResponse } from './envelope'

/** A very long name, deliberately, to test the 360px layout — CLAUDE.md 6.3's "ends in 3333" case. */
const VERY_LONG_NAME =
  'Chukwuemeka Ngozi Adaeze Oluwatobiloba Ibrahim Abdulrahman Nwachukwu-Okonkwo-Balogun-Adeyemi'

/** Deliberately hostile — proves the resolved name renders as text only, never HTML. */
const HOSTILE_NAME = '<b>Ade</b><img src=x onerror=alert(1)>'

/** Same account number always resolves to the same name — a demo has to be repeatable. */
function deterministicName(accountNumber: string): string {
  const seed = Number(accountNumber.slice(0, 8))
  const firstIndex = seed % FIRST_NAMES.length
  const lastIndex = Math.floor(seed / FIRST_NAMES.length) % LAST_NAMES.length
  const firstName = FIRST_NAMES[firstIndex] ?? FIRST_NAMES[0]
  const lastName = LAST_NAMES[lastIndex] ?? LAST_NAMES[0]
  return `${firstName} ${lastName}`
}

interface NameEnquiryRequestBody {
  accountNumber?: unknown
  bankCode?: unknown
}

function resolveAccountName(
  accountNumber: string,
): { accountName: string } | { errorCode: number; message: string } {
  if (accountNumber.endsWith('0000')) {
    return { errorCode: 404, message: 'Account not found' }
  }
  if (accountNumber.endsWith('1111')) {
    return { errorCode: 422, message: "This account can't receive funds" }
  }
  if (accountNumber.endsWith('2222')) {
    return { accountName: HOSTILE_NAME }
  }
  if (accountNumber.endsWith('3333')) {
    return { accountName: VERY_LONG_NAME }
  }
  return { accountName: deterministicName(accountNumber) }
}

export const nameEnquiryHandlers = [
  http.post('/api/name-enquiry', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as NameEnquiryRequestBody
    const accountNumber = typeof body.accountNumber === 'string' ? body.accountNumber : ''
    const bankCode = typeof body.bankCode === 'string' ? body.bankCode : ''

    if (!isValidNubanCheckDigit(accountNumber, bankCode)) {
      await delay(randomLatencyMs())
      return errorResponse(400, 'Invalid account number')
    }

    // Ends in 9999: delay past the client's own timeout, then resolve normally — this
    // is what lets the UI's "timed out" state actually be reachable and demoable.
    if (accountNumber.endsWith('9999')) {
      await delay(REQUEST_TIMEOUT_MS + 1000)
      return okResponse({
        accountName: deterministicName(accountNumber),
        nameEnquiryRef: crypto.randomUUID(),
      })
    }

    await delay(randomLatencyMs())

    if (shouldSimulateFailure()) {
      return errorResponse(500, 'Could not confirm the name right now.')
    }

    const resolved = resolveAccountName(accountNumber)
    if ('errorCode' in resolved) {
      return errorResponse(resolved.errorCode, resolved.message)
    }

    const ref = crypto.randomUUID()
    saveNameEnquiry({
      ref,
      accountNumber,
      bankCode,
      accountName: resolved.accountName,
      createdAt: Date.now(),
    })

    return okResponse({ accountName: resolved.accountName, nameEnquiryRef: ref })
  }),
]
