import { createFileRoute } from '@tanstack/react-router'

import { RecipeEditPage } from '@/features/recipes/recipe-edit-page'
import { recipeQueryOptions } from '@/features/recipes/recipes-queries'

export const Route = createFileRoute('/_authed/recipes/$recipeId/edit')({
  loader: ({ context, params }) => context.queryClient.query(recipeQueryOptions(params.recipeId)),
  head: ({ loaderData }) => ({ meta: [{ title: loaderData && `Edit ${loaderData.name}` }] }),
  component: RecipeEditPage,
})
