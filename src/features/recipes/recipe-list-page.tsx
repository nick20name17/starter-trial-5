import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useDeferredValue, useState, type SubmitEvent } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  MEAL_TYPES,
  RECIPE_SORTS,
  RECIPES_PER_PAGE,
  recipeListQueryOptions,
  recipeTagsQueryOptions,
  type RecipeListSearch,
  type RecipeSort,
} from './recipes-queries'

const route = getRouteApi('/_authed/recipes/')

const sortItems = Object.entries(RECIPE_SORTS).map(([value, { label }]) => ({ value, label }))
const mealTypeItems = [
  { value: '', label: 'Any meal' },
  ...MEAL_TYPES.map((mealType) => ({ value: mealType, label: mealType })),
]

function isRecipeSort(value: string): value is RecipeSort {
  return value in RECIPE_SORTS
}

interface FilterSelectProps {
  id: string
  label: string
  items: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}

function FilterSelect({ id, label, items, value, onChange }: FilterSelectProps) {
  return (
    <Field className='w-auto'>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select items={items} value={value} onValueChange={(next) => onChange(next ?? '')}>
        <SelectTrigger id={id} className='min-w-32'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export function RecipeListPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  // The search whose list is on screen: React keeps it while the list of the next one loads
  const listSearch = useDeferredValue(search)
  const { data } = useSuspenseQuery(recipeListQueryOptions(listSearch))
  const { data: tags } = useSuspenseQuery(recipeTagsQueryOptions())
  const [query, setQuery] = useState(search.q)
  const [urlQuery, setUrlQuery] = useState(search.q)
  const pageCount = Math.ceil(data.total / RECIPES_PER_PAGE)
  const hasFilters = Boolean(search.q || search.tag || search.mealType)
  const tagItems = [
    { value: '', label: 'Any tag' },
    ...tags.map((tag) => ({ value: tag, label: tag })),
  ]

  // Back and forward change q, so the field follows the URL. A submit keeps the text and focus
  if (search.q !== urlQuery) {
    setUrlQuery(search.q)
    setQuery(search.q)
  }

  // From prev, not a spread of search: that is the loaded search and drops a change still loading
  function updateSearch(changes: Partial<RecipeListSearch>) {
    void navigate({ search: (prev) => ({ ...prev, ...changes, page: 1 }) })
  }

  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    updateSearch({ q: query.trim() })
  }

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 p-6'>
      <div className='flex items-center justify-between gap-2'>
        <h1 className='font-medium'>Recipes</h1>
        <Link to='/recipes/new' className={buttonVariants()}>
          New recipe
        </Link>
      </div>
      <search className='flex flex-col gap-4'>
        <form className='flex gap-2' onSubmit={handleSearch}>
          <Input
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search recipes'
            aria-label='Search recipes'
          />
          <Button type='submit' pending={search.q !== listSearch.q}>
            Search
          </Button>
        </form>
        <div className='flex flex-wrap gap-4'>
          <FilterSelect
            id='recipe-tag'
            label='Tag'
            items={tagItems}
            value={search.tag}
            onChange={(tag) => updateSearch({ tag })}
          />
          <FilterSelect
            id='recipe-meal-type'
            label='Meal'
            items={mealTypeItems}
            value={search.mealType}
            onChange={(mealType) => updateSearch({ mealType })}
          />
          <FilterSelect
            id='recipe-sort'
            label='Sort by'
            items={sortItems}
            value={search.sort}
            onChange={(sort) => {
              if (isRecipeSort(sort)) updateSearch({ sort })
            }}
          />
        </div>
      </search>
      {data.recipes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No recipes found</EmptyTitle>
            <EmptyDescription>
              {hasFilters
                ? 'Try a different search or fewer filters.'
                : 'There are no recipes yet.'}
            </EmptyDescription>
          </EmptyHeader>
          {hasFilters && (
            <EmptyContent>
              <Link to='/recipes' className={buttonVariants({ variant: 'outline' })}>
                Clear filters
              </Link>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <>
          {/* Above the list: a search can shorten the list and shift a nav below it */}
          <nav aria-label='Pagination' className='flex items-center gap-2'>
            {/* One text node: a page number of a new width would shift a separate node after it */}
            <p className='mr-auto text-sm'>{`Page ${listSearch.page} of ${pageCount}`}</p>
            {/* Disabled, not hidden: a button that appears after the API answers shifts the rest */}
            {search.page > 1 ? (
              <Link
                from='/recipes/'
                to='/recipes'
                search={(prev) => ({ ...prev, page: prev.page - 1 })}
                className={buttonVariants({ variant: 'outline' })}
              >
                Previous
              </Link>
            ) : (
              <Button variant='outline' disabled>
                Previous
              </Button>
            )}
            {search.page < pageCount ? (
              <Link
                from='/recipes/'
                to='/recipes'
                search={(prev) => ({ ...prev, page: prev.page + 1 })}
                className={buttonVariants({ variant: 'outline' })}
              >
                Next
              </Link>
            ) : (
              <Button variant='outline' disabled>
                Next
              </Button>
            )}
          </nav>
          {/* New rows per search: moving old rows after the API answers is a layout shift */}
          <ItemGroup key={JSON.stringify(listSearch)}>
            {data.recipes.map((recipe) => (
              <li key={recipe.id}>
                <Item
                  variant='outline'
                  render={<Link to='/recipes/$recipeId' params={{ recipeId: String(recipe.id) }} />}
                >
                  <ItemMedia variant='image'>
                    <img src={recipe.image} alt='' width={32} height={32} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{recipe.name}</ItemTitle>
                    <ItemDescription>
                      {`★ ${recipe.rating} · ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} min · ${recipe.mealType.join(', ')}`}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </li>
            ))}
          </ItemGroup>
        </>
      )}
    </div>
  )
}
