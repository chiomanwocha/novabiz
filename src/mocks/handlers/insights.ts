import { delay, http } from 'msw'

import { randomLatencyMs, shouldSimulateFailure } from '../controls'
import { computeInsights } from '../db/insights'
import { getSeedNow, getTransactions } from '../db/store'

import { errorResponse, okResponse } from './envelope'

export const insightsHandlers = [
  http.get('/api/merchant/insights', async () => {
    await delay(randomLatencyMs())

    if (shouldSimulateFailure()) {
      return errorResponse(500, 'Could not load your insights right now.')
    }

    return okResponse(computeInsights(getTransactions(), getSeedNow()))
  }),
]
