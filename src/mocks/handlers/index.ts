import { bankHandlers } from './banks'
import { merchantHandlers } from './merchant'
import { nameEnquiryHandlers } from './nameEnquiry'
import { transactionHandlers } from './transactions'
import { transferHandlers } from './transfers'

export const handlers = [
  ...merchantHandlers,
  ...bankHandlers,
  ...transactionHandlers,
  ...nameEnquiryHandlers,
  ...transferHandlers,
]
