import ky, { isHTTPError, isNetworkError, isTimeoutError } from 'ky'
import { z } from 'zod/mini'

import { env } from '@/lib/env'
import { clearSession, getSession, setSession } from '@/lib/session'
import { type Session, sessionSchema } from '@/lib/session-schema'

let refreshing: Promise<Session | undefined> | undefined

// One refresh for every request that got a 401 at the same time: each would otherwise spend
// the same refresh token
function refreshSession(refreshToken: string) {
  refreshing ??= ky
    // Not api: its 401 hook would refresh again when the refresh itself answers 401
    .post('auth/refresh', { prefix: env.VITE_API_URL, json: { refreshToken }, retry: 0 })
    .json(sessionSchema)
    .then(
      (session) => {
        setSession(session)
        return session
      },
      () => {
        // Another tab may have refreshed first and spent this refresh token
        const stored = getSession()
        if (stored && stored.refreshToken !== refreshToken) return stored
        clearSession()
        return undefined
      },
    )
    .finally(() => {
      refreshing = undefined
    })
  return refreshing
}

export const api = ky.create({
  prefix: env.VITE_API_URL,
  retry: {
    jitter: true,
    maxRetryAfter: 10_000,
    // In tests a retry hides a mocked error: a once handler's 500 is retried into the next
    // handler's answer, and the error UI waits for the backoff. statusCodes, not retry: 0:
    // the retry after a token refresh counts against the limit
    ...(import.meta.env.MODE === 'test' && { statusCodes: [] }),
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const session = getSession()
        if (session) request.headers.set('Authorization', `Bearer ${session.accessToken}`)
      },
    ],
    afterResponse: [
      async ({ request, response, options }) => {
        if (response.status !== 401) return undefined
        const session = getSession()
        if (!session) return undefined
        // A flag on this request, not retryCount: that also counts retries after a 503
        if (options.context.tokenRetried) {
          // The API rejects a fresh token too: the session is dead. Signing out here, not in
          // each caller, sends every page to sign in
          clearSession()
          return undefined
        }
        options.context.tokenRetried = true
        // A refresh may have finished after this request left: retry with its token, or a
        // second refresh spends the new refresh token
        const sentWithCurrentToken =
          request.headers.get('Authorization') === `Bearer ${session.accessToken}`
        const refreshed = sentWithCurrentToken
          ? await refreshSession(session.refreshToken)
          : session
        if (!refreshed) return undefined
        const headers = new Headers(request.headers)
        headers.set('Authorization', `Bearer ${refreshed.accessToken}`)
        return ky.retry({ request: new Request(request, { headers }) })
      },
    ],
  },
})

const apiErrorSchema = z.object({ message: z.string().check(z.minLength(1)) })

export function getErrorMessage(error: unknown) {
  if (isNetworkError(error)) return 'Check your internet connection and try again.'
  if (isTimeoutError(error)) return 'The server took too long to respond. Try again.'
  if (isHTTPError(error)) {
    const parsed = apiErrorSchema.safeParse(error.data)
    if (parsed.success) return parsed.data.message
  }
  return 'Try again.'
}
