import { bankHandlers } from './banks'
import { insightsHandlers } from './insights'
import { merchantHandlers } from './merchant'
import { nameEnquiryHandlers } from './nameEnquiry'
import { transactionHandlers } from './transactions'
import { transferHandlers } from './transfers'

export const handlers = [
  ...merchantHandlers,
  ...insightsHandlers,
  ...bankHandlers,
  ...transactionHandlers,
  ...nameEnquiryHandlers,
  ...transferHandlers,
]
