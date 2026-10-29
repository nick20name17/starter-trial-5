import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { meQueryOptions } from '@/features/auth/auth-queries'
import { getSession, subscribeSession } from '@/lib/session'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const signIn = redirect({ to: '/sign-in', search: { redirect: location.href }, replace: true })
    if (!getSession()) throw signIn
    try {
      const user = await context.queryClient.query(meQueryOptions())
      return { user }
    } catch (error) {
      // api signs the user out on a 401 it cannot refresh past. An error page would not let them in
      if (!getSession()) throw signIn
      throw error
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Sign-out here or in another tab, or a dead session: beforeLoad sends the user to sign in
  useEffect(
    () =>
      subscribeSession(() => {
        // A token refresh writes the session too: invalidating then would reload the page
        if (getSession()) return
        // beforeLoad trusts a cached me, and the next user may be someone else
        queryClient.removeQueries({ queryKey: meQueryOptions().queryKey })
        void router.invalidate()
      }),
    [queryClient, router],
  )

  return <Outlet />
}
