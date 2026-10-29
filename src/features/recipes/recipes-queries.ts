import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod/mini'

import { api } from '@/lib/api'

export const RECIPES_PER_PAGE = 10

// DummyJSON has no list of meal types: these are the ones its recipes use
export const MEAL_TYPES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'Appetizer',
  'Side Dish',
  'Beverage',
] as const

export const RECIPE_SORTS = {
  name: { label: 'Name', sortBy: 'name', order: 'asc' },
  rating: { label: 'Top rated', sortBy: 'rating', order: 'desc' },
  prepTime: { label: 'Quickest prep', sortBy: 'prepTimeMinutes', order: 'asc' },
} as const

export type RecipeSort = keyof typeof RECIPE_SORTS

export interface RecipeListSearch {
  q: string
  tag: string
  mealType: string
  sort: RecipeSort
  page: number
}

const recipeSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  // Not z.url(): it rejects a relative path, which <img> loads fine
  image: z.string(),
  rating: z.number(),
  prepTimeMinutes: z.number(),
  cookTimeMinutes: z.number(),
  tags: z.array(z.string()),
  mealType: z.array(z.string()),
})

const recipeListSchema = z.object({
  recipes: z.array(recipeSummarySchema),
  total: z.number(),
})

export function recipeTagsQueryOptions() {
  return queryOptions({
    queryKey: ['recipes', 'tags'],
    // Tags change only when recipes do, which DummyJSON never stores
    staleTime: Infinity,
    queryFn: ({ signal }) => api.get('recipes/tags', { signal }).json(z.array(z.string())),
  })
}

// DummyJSON filters by one of search, tag or meal type per request. The first one set goes to
// the API; with more, the app fetches every match and narrows and pages them itself
function listPath({ q, tag, mealType }: RecipeListSearch) {
  if (q) return { path: 'recipes/search', q }
  if (tag) return { path: `recipes/tag/${encodeURIComponent(tag)}` }
  if (mealType) return { path: `recipes/meal-type/${encodeURIComponent(mealType)}` }
  return { path: 'recipes' }
}

function matchesFilters(recipe: z.infer<typeof recipeSummarySchema>, search: RecipeListSearch) {
  const tagMatches = !search.tag || recipe.tags.includes(search.tag)
  // DummyJSON's meal-type endpoint ignores case
  const mealTypeMatches =
    !search.mealType ||
    recipe.mealType.some((mealType) => mealType.toLowerCase() === search.mealType.toLowerCase())
  return tagMatches && mealTypeMatches
}

export function recipeListQueryOptions(search: RecipeListSearch) {
  return queryOptions({
    queryKey: ['recipes', 'list', search],
    queryFn: async ({ signal }) => {
      const { path, q } = listPath(search)
      const filterCount = [search.q, search.tag, search.mealType].filter(Boolean).length
      const narrowsInApp = filterCount > 1
      const { sortBy, order } = RECIPE_SORTS[search.sort]
      const skip = (search.page - 1) * RECIPES_PER_PAGE
      const list = await api
        .get(path, {
          searchParams: {
            ...(q && { q }),
            sortBy,
            order,
            // limit=0 is every match
            limit: narrowsInApp ? 0 : RECIPES_PER_PAGE,
            skip: narrowsInApp ? 0 : skip,
            select: 'name,image,rating,prepTimeMinutes,cookTimeMinutes,tags,mealType',
          },
          signal,
        })
        .json(recipeListSchema)
      if (!narrowsInApp) return list
      const matches = list.recipes.filter((recipe) => matchesFilters(recipe, search))
      return { recipes: matches.slice(skip, skip + RECIPES_PER_PAGE), total: matches.length }
    },
  })
}
