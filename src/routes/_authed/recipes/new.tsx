import { createFileRoute } from '@tanstack/react-router'

import { RecipeCreatePage } from '@/features/recipes/recipe-create-page'

export const Route = createFileRoute('/_authed/recipes/new')({
  head: () => ({ meta: [{ title: 'New recipe' }] }),
  component: RecipeCreatePage,
})
