import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { z } from 'zod/mini'

import { api } from '@/lib/api'
import { setSession } from '@/lib/session'

const userSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
})

const signInResponseSchema = z.extend(userSchema, {
  accessToken: z.string(),
  refreshToken: z.string(),
})

export function meQueryOptions() {
  return queryOptions({
    queryKey: ['auth', 'me'],
    // The name does not change while signed in, and _authed reads it before every page
    staleTime: Infinity,
    queryFn: ({ signal }) => api.get('auth/me', { signal }).json(userSchema),
  })
}

export function signInMutationOptions() {
  return mutationOptions({
    mutationFn: (credentials: { username: string; password: string }) =>
      api.post('auth/login', { json: credentials }).json(signInResponseSchema),
    onSuccess: (
      { accessToken, refreshToken, ...user },
      _credentials,
      _onMutateResult,
      { client },
    ) => {
      // Here, not at sign-out: a page of the last user is gone by now, so nothing refetches.
      // A new user must not see the last one's cached data
      client.removeQueries()
      setSession({ accessToken, refreshToken })
      client.setQueryData(meQueryOptions().queryKey, user)
    },
  })
}
