import type { QueryClient } from '@tanstack/react-query'
import { createRouter, type RouterHistory } from '@tanstack/react-router'

import { RouteError } from '@/app/route-error'
import { RouteNotFound } from '@/app/route-not-found'
import { RoutePending } from '@/app/route-pending'
import { routeTree } from '@/routeTree.gen'

// The default parser JSON.parses values: ?id=723421968459640832 loses digits and q: '2024' is
// written as ?q=%222024%22 (TanStack/router#6044). Values stay text; route schemas coerce numbers
function parseSearch(searchStr: string) {
  return Object.fromEntries(new URLSearchParams(searchStr))
}

function stringifySearch(search: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const searchStr = params.toString()
  return searchStr ? `?${searchStr}` : ''
}

export function createAppRouter(queryClient: QueryClient, history?: RouterHistory) {
  return createRouter({
    routeTree,
    history,
    context: { queryClient },
    parseSearch,
    stringifySearch,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultNotFoundComponent: RouteNotFound,
    defaultErrorComponent: RouteError,
    defaultPendingComponent: RoutePending,
  })
}

export type AppRouter = ReturnType<typeof createAppRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}
