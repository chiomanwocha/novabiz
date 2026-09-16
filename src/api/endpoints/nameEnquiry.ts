import { apiRequest } from '../client'
import type { NameEnquiryResponseDto } from '../types'

export interface NameEnquiryRequestDto {
  accountNumber: string
  bankCode: string
}

export function postNameEnquiry(request: NameEnquiryRequestDto): Promise<NameEnquiryResponseDto> {
  return apiRequest<NameEnquiryResponseDto>('/api/name-enquiry', {
    method: 'POST',
    body: request,
  })
}
