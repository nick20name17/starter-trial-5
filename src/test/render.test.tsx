import { delay, http, HttpResponse } from 'msw'
import { expect, test, vi } from 'vitest'

import { setSession } from '@/lib/session'
import { lashMascaraHandler } from '@/test/products'
import { renderRoute, signedInSession, signedInUser } from '@/test/render'
import { worker } from '@/test/worker'

test('a link under the cursor does not load its page', async () => {
  const searchProducts = vi.fn<() => Response>(() => HttpResponse.json({ products: [], total: 0 }))
  worker.use(lashMascaraHandler(), http.get('*/products/search', searchProducts))
  const screen = await renderRoute('/products/1')

  await screen.getByRole('link', { name: 'All products' }).hover()
  const longerThanPreloadDelay = 300
  await new Promise((resolve) => {
    setTimeout(resolve, longerThanPreloadDelay)
  })

  expect(searchProducts).not.toHaveBeenCalled()
})

// This test and the next run in order: the first ends while its page still loads, and its next
// request would come after the handlers reset, an unhandled request that fails the next test
test('a test can end while its page still loads', async () => {
  setSession(signedInSession)
  worker.use(
    http.get('*/auth/me', async () => {
      await delay(50)
      return HttpResponse.json(signedInUser)
    }),
    http.get('*/products/search', () => HttpResponse.json({ products: [], total: 0 })),
  )

  const screen = await renderRoute('/products', { signedIn: false })

  expect(screen.router.state.isLoading).toBe(true)
})

test('the page a test left loading sends no request into the next test', async () => {
  await new Promise((resolve) => {
    setTimeout(resolve, 200)
  })

  expect(console.error).not.toHaveBeenCalled()
})
