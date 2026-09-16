import type { Kobo } from '../../lib/money'
import { apiRequest } from '../client'
import type { TransferRecordDto } from '../types'

export interface TransferRequestDto {
  accountNumber: string
  bankCode: string
  amountKobo: Kobo
  nameEnquiryRef: string
  narration?: string
}

/** `idempotencyKey` is created once per transfer attempt by the caller and reused on retry. */
export function postTransfer(
  request: TransferRequestDto,
  idempotencyKey: string,
): Promise<TransferRecordDto> {
  return apiRequest<TransferRecordDto>('/api/transfers', {
    method: 'POST',
    body: request,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

/** Used to reconcile after a timeout: ask the server what actually happened for this key. */
export function getTransferStatus(idempotencyKey: string): Promise<TransferRecordDto> {
  return apiRequest<TransferRecordDto>(`/api/transfers/${encodeURIComponent(idempotencyKey)}`)
}
