import type { QueryClient } from '@tanstack/react-query'
import { createMemoryHistory } from '@tanstack/react-router'
import { http, HttpResponse } from 'msw'
import { vi } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'

import { App } from '@/app'
import { createQueryClient } from '@/app/query-client'
import { type AppRouter, createAppRouter } from '@/app/router'
import { setSession } from '@/lib/session'
import { worker } from '@/test/worker'

export const signedInUser = { firstName: 'Emily', lastName: 'Johnson' }

export const signedInSession = { accessToken: 'access-1', refreshToken: 'refresh-1' }

let renderedApp: { queryClient: QueryClient; router: AppRouter } | undefined

// A test can end while its page still loads, and vitest-browser-react unmounts the app only
// before the next test: a request sent after setup.ts resets the handlers fails the next test
export async function stopApp() {
  if (renderedApp) {
    const { queryClient, router } = renderedApp
    renderedApp = undefined
    await vi
      .waitUntil(
        () => !router.state.isLoading && queryClient.isFetching() + queryClient.isMutating() === 0,
      )
      .catch(() => {
        throw new Error(
          'The app still loads 1 s after the test ended. Wait for the page the test opened, or answer the request a handler holds',
        )
      })
  }
  await cleanup()
}

// Signed in by default: most pages are under _authed
export async function renderRoute(path: string, { signedIn = true } = {}) {
  if (signedIn) {
    setSession(signedInSession)
    worker.use(http.get('*/auth/me', () => HttpResponse.json(signedInUser)))
  }
  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient, createMemoryHistory({ initialEntries: [path] }))
  // The cursor stays from the last test, and a link under it would preload with unmocked requests
  router.update({ ...router.options, defaultPreload: false })
  renderedApp = { queryClient, router }
  const screen = await render(<App queryClient={queryClient} router={router} />)
  return Object.assign(screen, { router })
}
