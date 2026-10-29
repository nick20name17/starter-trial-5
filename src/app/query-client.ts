import { MutationCache, QueryClient } from '@tanstack/react-query'

import { toast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/api'

declare module '@tanstack/react-query' {
  interface Register {
    // false for a mutation whose UI shows its own error, such as a form
    mutationMeta: { errorToast?: false }
  }
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: false,
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (mutation.meta?.errorToast === false) return
        toast.add({
          type: 'error',
          priority: 'high',
          title: 'Something went wrong',
          description: getErrorMessage(error),
        })
      },
    }),
  })
}
