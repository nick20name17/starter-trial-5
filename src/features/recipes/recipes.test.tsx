import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { testImage } from '@/test/image'
import { renderRoute } from '@/test/render'
import { worker } from '@/test/worker'

function recipeSummary(id: number, name: string, overrides: object = {}) {
  return {
    id,
    name,
    image: testImage,
    rating: 4.5,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    tags: ['Pizza'],
    mealType: ['Dinner'],
    ...overrides,
  }
}

function tagsHandler() {
  return http.get('*/recipes/tags', () => HttpResponse.json(['Pizza', 'Pasta']))
}

// Names the one recipe it returns after the request, so a test reads what the page asked for
function echoListHandler(path: string) {
  return http.get(path, ({ request }) => {
    const url = new URL(request.url)
    return HttpResponse.json({
      recipes: [recipeSummary(1, `${url.pathname}${url.search}`)],
      total: 25,
    })
  })
}

test('the list sends its one filter, sort and page to the API', async () => {
  worker.use(tagsHandler(), echoListHandler('*/recipes/meal-type/:mealType'))
  const screen = await renderRoute('/recipes?mealType=Side+Dish&sort=rating&page=2')

  await expect
    .element(
      screen.getByText(
        '/recipes/meal-type/Side%20Dish?sortBy=rating&order=desc&limit=10&skip=10&select=name%2Cimage%2Crating%2CprepTimeMinutes%2CcookTimeMinutes%2Ctags%2CmealType',
      ),
    )
    .toBeVisible()
  await expect.element(screen.getByText('Page 2 of 3')).toBeVisible()
})

test('a search with a tag and a meal type narrows and pages every match in the app', async () => {
  const matches = Array.from({ length: 12 }, (_, index) =>
    recipeSummary(index + 1, `Pizza ${index + 1}`, { tags: ['Pizza'], mealType: ['Lunch'] }),
  )
  let apiSearch = ''
  worker.use(
    tagsHandler(),
    http.get('*/recipes/search', ({ request }) => {
      apiSearch = new URL(request.url).search
      return HttpResponse.json({
        recipes: [
          ...matches,
          recipeSummary(20, 'Pizza for dinner', { tags: ['Pizza'], mealType: ['Dinner'] }),
          recipeSummary(21, 'Pasta for lunch', { tags: ['Pasta'], mealType: ['Lunch'] }),
        ],
        total: 14,
      })
    }),
  )
  const screen = await renderRoute('/recipes?q=pi&tag=Pizza&mealType=lunch&page=2')

  await expect.element(screen.getByText('Pizza 11')).toBeVisible()
  await expect.element(screen.getByText('Pizza 12')).toBeVisible()
  await expect.element(screen.getByText('Page 2 of 2')).toBeVisible()
  await expect.element(screen.getByText('Pizza for dinner')).not.toBeInTheDocument()
  await expect.element(screen.getByText('Pasta for lunch')).not.toBeInTheDocument()
  expect(new URLSearchParams(apiSearch).get('limit')).toBe('0')
})

test('picking a filter keeps the others in the URL and opens the first page', async () => {
  worker.use(
    tagsHandler(),
    echoListHandler('*/recipes/search'),
    echoListHandler('*/recipes/tag/:tag'),
  )
  const screen = await renderRoute('/recipes?tag=Pizza&sort=prepTime&page=3')
  await expect.element(screen.getByText('Page 3 of 3')).toBeVisible()

  await screen.getByRole('combobox', { name: 'Tag' }).click()
  await screen.getByRole('option', { name: 'Pasta' }).click()

  await expect.element(screen.getByText('Page 1 of 3')).toBeVisible()
  expect(screen.router.state.location.searchStr).toBe('?tag=Pasta&sort=prepTime')
  await expect.element(screen.getByRole('combobox', { name: 'Tag' })).toHaveTextContent('Pasta')
})

test('a search with no matches offers to clear the filters', async () => {
  worker.use(
    tagsHandler(),
    http.get('*/recipes/search', () => HttpResponse.json({ recipes: [], total: 0 })),
    echoListHandler('*/recipes'),
  )
  const screen = await renderRoute('/recipes?q=nothing')

  await expect.element(screen.getByText('No recipes found')).toBeVisible()
  await screen.getByRole('link', { name: 'Clear filters' }).click()

  await expect.element(screen.getByText('Page 1 of 3')).toBeVisible()
  await expect.element(screen.getByRole('searchbox', { name: 'Search recipes' })).toHaveValue('')
})

test('a page past the end and an unknown sort open the last page sorted by name', async () => {
  worker.use(tagsHandler(), echoListHandler('*/recipes'))
  const screen = await renderRoute('/recipes?sort=spiciest&page=99')

  await expect.element(screen.getByText('Page 3 of 3')).toBeVisible()
  await expect
    .element(screen.getByText(/^\/recipes\?sortBy=name&order=asc&limit=10&skip=20&/))
    .toBeVisible()
})
