import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { isHTTPError } from 'ky'
import { z } from 'zod/mini'

import { api } from '@/lib/api'

export const PRODUCTS_PER_PAGE = 12

const productSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number(),
  // Not z.url(): it rejects a relative path, which <img> loads fine
  thumbnail: z.string(),
})

const productListSchema = z.object({
  products: z.array(productSummarySchema),
  total: z.number(),
})

const productSchema = z.extend(productSummarySchema, {
  description: z.string(),
})

export function productListQueryOptions({ q, page }: { q: string; page: number }) {
  return queryOptions({
    queryKey: ['products', 'list', { q, page }],
    queryFn: ({ signal }) =>
      api
        .get('products/search', {
          searchParams: {
            q,
            limit: PRODUCTS_PER_PAGE,
            skip: (page - 1) * PRODUCTS_PER_PAGE,
            select: 'title,price,thumbnail',
          },
          signal,
        })
        .json(productListSchema),
  })
}

export function productQueryOptions(productId: string) {
  return queryOptions({
    queryKey: ['products', 'detail', productId],
    queryFn: async ({ signal }) => {
      try {
        return await api
          .get(`products/${encodeURIComponent(productId)}`, { signal })
          .json(productSchema)
      } catch (error) {
        if (isHTTPError(error) && error.response.status === 404) throw notFound()
        throw error
      }
    },
  })
}

export function productUpdateMutationOptions(productId: string) {
  return mutationOptions({
    mutationFn: (changes: Pick<z.infer<typeof productSchema>, 'title' | 'price'>) =>
      api.patch(`products/${encodeURIComponent(productId)}`, { json: changes }).json(productSchema),
    onSuccess: (product, _changes, _onMutateResult, { client }) => {
      // Use the response: DummyJSON stores no writes, so a refetch would bring the old product back
      client.setQueryData(productQueryOptions(productId).queryKey, product)
      // Lists show the title and price too: a real API returns them edited, DummyJSON unchanged
      return client.invalidateQueries({ queryKey: ['products', 'list'] })
    },
  })
}
