import { HttpResponse } from 'msw'

/**
 * Every mock response uses `{ code, message, data }`, with the HTTP status mirroring
 * `code` — so a thrown/rejected fetch (non-2xx, network error, or timeout) is what
 * drives `api/client.ts`'s error handling, not a `data?.code === 200` check on a
 * "successful" response.
 */
export function okResponse(data: unknown, message = 'OK') {
  return HttpResponse.json({ code: 200, message, data }, { status: 200 })
}

export function errorResponse(code: number, message: string) {
  return HttpResponse.json({ code, message, data: null }, { status: code })
}
