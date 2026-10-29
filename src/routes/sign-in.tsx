import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod/mini'

import { SignInPage } from '@/features/auth/sign-in-page'
import { getSession } from '@/lib/session'

const signInSearchSchema = z.object({
  // A path on this site only: ?redirect=https://evil.example would send the user away signed in.
  // Browsers read /\ like //, the start of another host, and drop a tab or newline inside a URL
  redirect: z.catch(z.optional(z.string().check(z.regex(/^\/(?![/\\])\S*$/))), undefined),
})

export const Route = createFileRoute('/sign-in')({
  validateSearch: signInSearchSchema,
  beforeLoad: ({ search }) => {
    if (getSession()) throw redirect({ href: search.redirect ?? '/', replace: true })
  },
  head: () => ({ meta: [{ title: 'Sign in' }] }),
  component: SignInPage,
})
