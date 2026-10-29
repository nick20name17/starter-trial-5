import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'

import type { AppRouter } from '@/app/router'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toast'

import '@/index.css'

interface AppProps {
  queryClient: QueryClient
  router: AppRouter
}

export function App({ queryClient, router }: AppProps) {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Toaster>
            <RouterProvider router={router} />
          </Toaster>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
