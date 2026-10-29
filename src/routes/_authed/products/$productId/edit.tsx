import { createFileRoute } from '@tanstack/react-router'

import { ProductEditPage } from '@/features/products/product-edit-page'
import { productQueryOptions } from '@/features/products/products-queries'

export const Route = createFileRoute('/_authed/products/$productId/edit')({
  loader: ({ context, params }) => context.queryClient.query(productQueryOptions(params.productId)),
  head: ({ loaderData }) => ({ meta: [{ title: loaderData && `Edit ${loaderData.title}` }] }),
  component: ProductEditPage,
})
