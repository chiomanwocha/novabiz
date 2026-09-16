import { useQuery } from '@tanstack/react-query'

import { postNameEnquiry } from '../../../api/endpoints/nameEnquiry'
import { ApiError } from '../../../api/errors'
import type { NameEnquiryResponseDto } from '../../../api/types'
import { isNubanFormat, isValidNubanCheckDigit } from '../../../lib/nuban'

export type NameEnquiryErrorReason = 'not_found' | 'cannot_receive' | 'timeout' | 'network'

export type NameEnquiryState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'resolved'; name: string; ref: string }
  | { status: 'error'; reason: NameEnquiryErrorReason; message: string; retry: () => void }

export interface UseNameEnquiryParams {
  bankCode: string | null
  accountNumber: string
}

function mapErrorToReason(error: ApiError): NameEnquiryErrorReason {
  if (error.kind === 'timeout') {
    return 'timeout'
  }
  if (error.kind === 'network') {
    return 'network'
  }
  if (error.status === 404) {
    return 'not_found'
  }
  if (error.status === 422) {
    return 'cannot_receive'
  }
  return 'network'
}

/**
 * Runs only once a bank is selected, the number has 10 digits, and the check digit
 * passes — keyed on [bankCode, accountNumber], so an in-flight response for an account
 * the user has since edited away from can never land on top of a newer one; React Query
 * simply has no cache entry to apply it to. The returned state is derived fresh from the
 * query every render, so a resolved name clears the instant the key changes — never left
 * to an effect running a render behind.
 */
export function useNameEnquiry({
  bankCode,
  accountNumber,
}: UseNameEnquiryParams): NameEnquiryState {
  const isEnabled =
    bankCode !== null &&
    isNubanFormat(accountNumber) &&
    isValidNubanCheckDigit(accountNumber, bankCode)

  const query = useQuery<NameEnquiryResponseDto, ApiError>({
    queryKey: ['nameEnquiry', bankCode, accountNumber],
    queryFn: () => postNameEnquiry({ accountNumber, bankCode: bankCode ?? '' }),
    enabled: isEnabled,
    retry: false,
  })

  if (!isEnabled) {
    return { status: 'idle' }
  }
  if (query.isPending) {
    return { status: 'checking' }
  }
  if (query.isError) {
    return {
      status: 'error',
      reason: mapErrorToReason(query.error),
      message: query.error.message,
      retry: () => {
        void query.refetch()
      },
    }
  }
  return { status: 'resolved', name: query.data.accountName, ref: query.data.nameEnquiryRef }
}
