import { createFileRoute, redirect, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod/mini'

import { ProductListPage } from '@/features/products/product-list-page'
import { PRODUCTS_PER_PAGE, productListQueryOptions } from '@/features/products/products-queries'

const defaultSearch = { q: '', page: 1 }

const productListSearchSchema = z.object({
  q: z.catch(z._default(z.string(), defaultSearch.q), defaultSearch.q),
  page: z.catch(
    z._default(z.pipe(z.coerce.number<number>(), z.int().check(z.positive())), defaultSearch.page),
    defaultSearch.page,
  ),
})

export const Route = createFileRoute('/_authed/products/')({
  validateSearch: productListSearchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, cause }) => {
    // A new search on this page keeps the last list on screen while it loads (useDeferredValue in
    // the page). Awaited here, it would hold the URL back and then replace the page with a spinner
    if (cause === 'stay') return
    const { total } = await context.queryClient.query(productListQueryOptions(deps))
    const lastPage = Math.ceil(total / PRODUCTS_PER_PAGE)
    // The API answers a page past the end with no products, which would hide the pagination
    if (total > 0 && deps.page > lastPage) {
      throw redirect({ to: '/products', search: { ...deps, page: lastPage }, replace: true })
    }
  },
  head: () => ({ meta: [{ title: 'Products' }] }),
  component: ProductListPage,
})
