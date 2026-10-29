import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/features/auth/user-menu'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <HeadContent />
      {/* Pages fill the space with flex-1: min-h-svh would add the header's height and scroll */}
      <div className='flex min-h-svh flex-col'>
        <header className='flex items-center justify-end gap-2 p-4'>
          <UserMenu />
          <ThemeToggle />
        </header>
        {/* mx-auto stops the column's stretch, so a centered page needs w-full to fill the width */}
        <main className='flex flex-1 flex-col'>
          <Outlet />
        </main>
      </div>
    </>
  )
}
