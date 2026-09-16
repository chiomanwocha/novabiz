import { delay, http } from 'msw'

import { randomLatencyMs, shouldSimulateFailure } from '../controls'
import { getMerchant } from '../db/store'

import { errorResponse, okResponse } from './envelope'

export const merchantHandlers = [
  http.get('/api/merchant', async () => {
    await delay(randomLatencyMs())

    if (shouldSimulateFailure()) {
      return errorResponse(500, 'Could not load your account right now.')
    }

    return okResponse(getMerchant())
  }),
]
