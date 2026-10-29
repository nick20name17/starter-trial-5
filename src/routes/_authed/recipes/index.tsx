import { createFileRoute, redirect, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod/mini'

import { RecipeListPage } from '@/features/recipes/recipe-list-page'
import {
  RECIPES_PER_PAGE,
  recipeListQueryOptions,
  recipeTagsQueryOptions,
  type RecipeListSearch,
} from '@/features/recipes/recipes-queries'

const defaultSearch: RecipeListSearch = { q: '', tag: '', mealType: '', sort: 'name', page: 1 }

function text(fallback: string) {
  return z.catch(z._default(z.string(), fallback), fallback)
}

const recipeListSearchSchema = z.object({
  q: text(defaultSearch.q),
  tag: text(defaultSearch.tag),
  mealType: text(defaultSearch.mealType),
  sort: z.catch(
    z._default(z.enum(['name', 'rating', 'prepTime']), defaultSearch.sort),
    defaultSearch.sort,
  ),
  page: z.catch(
    z._default(z.pipe(z.coerce.number<number>(), z.int().check(z.positive())), defaultSearch.page),
    defaultSearch.page,
  ),
})

export const Route = createFileRoute('/_authed/recipes/')({
  validateSearch: recipeListSearchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps, cause }) => {
    // A new search on this page keeps the last list on screen while it loads (useDeferredValue in
    // the page). Awaited here, it would hold the URL back and then replace the page with a spinner
    if (cause === 'stay') return
    const [{ total }] = await Promise.all([
      context.queryClient.query(recipeListQueryOptions(deps)),
      context.queryClient.query(recipeTagsQueryOptions()),
    ])
    const lastPage = Math.ceil(total / RECIPES_PER_PAGE)
    // The API answers a page past the end with no recipes, which would hide the pagination
    if (total > 0 && deps.page > lastPage) {
      throw redirect({ to: '/recipes', search: { ...deps, page: lastPage }, replace: true })
    }
  },
  head: () => ({ meta: [{ title: 'Recipes' }] }),
  component: RecipeListPage,
})
