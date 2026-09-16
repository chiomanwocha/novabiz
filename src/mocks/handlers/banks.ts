import { delay, http } from 'msw'

import { randomLatencyMs, shouldSimulateFailure } from '../controls'
import { getBanks } from '../db/store'

import { errorResponse, okResponse } from './envelope'

export const bankHandlers = [
  http.get('/api/banks', async () => {
    await delay(randomLatencyMs())

    if (shouldSimulateFailure()) {
      return errorResponse(500, 'Could not load the bank list right now.')
    }

    // Mock data — codes are for demo purposes and not guaranteed to match every real bank.
    return okResponse(getBanks())
  }),
]
