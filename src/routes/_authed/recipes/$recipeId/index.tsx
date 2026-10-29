import { createFileRoute } from '@tanstack/react-router'

import { RecipePage } from '@/features/recipes/recipe-page'
import { recipeQueryOptions } from '@/features/recipes/recipes-queries'

export const Route = createFileRoute('/_authed/recipes/$recipeId/')({
  loader: ({ context, params }) => context.queryClient.query(recipeQueryOptions(params.recipeId)),
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.name }] }),
  component: RecipePage,
})
