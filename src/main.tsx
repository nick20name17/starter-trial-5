import { createRoot } from 'react-dom/client'

import { App } from '@/app'
import { createQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root not found')

createRoot(rootEl).render(<App queryClient={queryClient} router={router} />)
