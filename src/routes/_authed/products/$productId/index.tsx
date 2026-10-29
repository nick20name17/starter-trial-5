import { createFileRoute } from '@tanstack/react-router'

import { ProductPage } from '@/features/products/product-page'
import { productQueryOptions } from '@/features/products/products-queries'

export const Route = createFileRoute('/_authed/products/$productId/')({
  loader: ({ context, params }) => context.queryClient.query(productQueryOptions(params.productId)),
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.title }] }),
  component: ProductPage,
})
