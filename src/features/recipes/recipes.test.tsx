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

const margherita = {
  ...recipeSummary(1, 'Classic Margherita Pizza', { tags: ['Pizza', 'Italian'] }),
  ingredients: ['Pizza dough', 'Tomato sauce'],
  instructions: ['Preheat the oven.', 'Bake for 15 minutes.'],
  servings: 4,
  difficulty: 'Effortless',
  cuisine: 'Italian',
  caloriesPerServing: 300,
  reviewCount: 98,
}

function margheritaHandler() {
  return http.get('*/recipes/1', () => HttpResponse.json(margherita))
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

test('a row of the list opens its recipe', async () => {
  worker.use(
    tagsHandler(),
    http.get('*/recipes', () =>
      HttpResponse.json({ recipes: [recipeSummary(1, 'Classic Margherita Pizza')], total: 1 }),
    ),
    margheritaHandler(),
  )
  const screen = await renderRoute('/recipes')

  await screen.getByRole('link', { name: /^Classic Margherita Pizza/ }).click()

  await expect
    .element(screen.getByRole('heading', { level: 1, name: 'Classic Margherita Pizza' }))
    .toBeVisible()
  await expect
    .element(screen.getByRole('listitem').filter({ hasText: 'Tomato sauce' }))
    .toBeVisible()
  await expect.element(screen.getByText('Bake for 15 minutes.')).toBeVisible()
  // An unknown difficulty from the API renders as a dash instead of failing the page
  await expect.element(screen.getByText('—')).toBeVisible()
  await expect.poll(() => document.title).toBe('Classic Margherita Pizza')
})

test('recipe id stays one segment of the API path', async () => {
  worker.use(
    http.get('*/recipes/:recipeId', ({ request }) =>
      HttpResponse.json({ ...margherita, name: new URL(request.url).pathname }),
    ),
  )
  const screen = await renderRoute('/recipes/..%2Fusers')

  await expect
    .element(screen.getByRole('heading', { level: 1, name: '/recipes/..%2Fusers' }))
    .toBeVisible()
})

test('unknown recipe shows the not found page', async () => {
  worker.use(
    http.get('*/recipes/404', () =>
      HttpResponse.json({ message: "Recipe with id '404' not found" }, { status: 404 }),
    ),
  )
  const screen = await renderRoute('/recipes/404')

  await expect.element(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

test('creating a recipe sends the form and opens the new recipe from the response', async () => {
  let sent: unknown
  worker.use(
    http.post<never, Record<string, unknown>>('*/recipes/add', async ({ request }) => {
      const recipe = await request.json()
      sent = recipe
      // DummyJSON answers with what it got and a new id it never stores
      return HttpResponse.json({ ...recipe, id: 51 }, { status: 201 })
    }),
  )
  const screen = await renderRoute('/recipes/new')

  await screen.getByRole('textbox', { name: 'Name' }).fill('  Shakshuka ')
  await screen.getByRole('textbox', { name: 'Cuisine' }).fill('Tunisian')
  await screen.getByRole('combobox', { name: 'Difficulty' }).click()
  await screen.getByRole('option', { name: 'Medium' }).click()
  await screen.getByRole('checkbox', { name: 'Breakfast' }).click()
  await screen.getByRole('textbox', { name: 'Tags' }).fill('Eggs, , Spicy ')
  await screen.getByRole('spinbutton', { name: 'Prep time, minutes' }).fill('10')
  await screen.getByRole('spinbutton', { name: 'Cook time, minutes' }).fill('20')
  await screen.getByRole('spinbutton', { name: 'Servings' }).fill('2')
  await screen.getByRole('spinbutton', { name: 'Calories per serving' }).fill('250')
  await screen.getByRole('textbox', { name: 'Ingredients' }).fill('4 eggs\n\n Tomatoes \n')
  await screen.getByRole('textbox', { name: 'Instructions' }).fill('Simmer the sauce.\nAdd eggs.')
  await screen.getByRole('button', { name: 'Create recipe' }).click()

  await expect.element(screen.getByRole('heading', { level: 1, name: 'Shakshuka' })).toBeVisible()
  await expect.element(screen.getByRole('dialog', { name: 'Recipe created' })).toBeVisible()
  expect(screen.router.state.location.pathname).toBe('/recipes/51')
  expect(sent).toEqual({
    name: 'Shakshuka',
    image: '',
    cuisine: 'Tunisian',
    difficulty: 'Medium',
    mealType: ['Breakfast'],
    tags: ['Eggs', 'Spicy'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    caloriesPerServing: 250,
    ingredients: ['4 eggs', 'Tomatoes'],
    instructions: ['Simmer the sauce.', 'Add eggs.'],
  })
})

test('the recipe form shows field errors and sends nothing', async () => {
  let requests = 0
  worker.use(
    http.post('*/recipes/add', () => {
      requests += 1
      return HttpResponse.json({})
    }),
  )
  const screen = await renderRoute('/recipes/new')

  await screen.getByRole('textbox', { name: 'Image URL' }).fill('cdn/pizza.webp')
  await screen.getByRole('spinbutton', { name: 'Prep time, minutes' }).fill('2.5')
  await screen.getByRole('spinbutton', { name: 'Servings' }).fill('')
  await screen.getByRole('button', { name: 'Create recipe' }).click()

  for (const message of [
    'Enter a name',
    'Enter a full URL, like https://…',
    'Enter a cuisine',
    'Pick at least one meal',
    'Enter the prep time in whole minutes',
    'Enter the servings',
    'Add at least one ingredient',
    'Add at least one step',
  ]) {
    await expect.element(screen.getByRole('alert').filter({ hasText: message })).toBeVisible()
  }
  await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
  expect(requests).toBe(0)
})

test('editing a recipe starts from it and shows the PATCH response', async () => {
  let changes: unknown
  worker.use(
    margheritaHandler(),
    http.patch<never, Record<string, unknown>>('*/recipes/1', async ({ request }) => {
      const body = await request.json()
      changes = body
      return HttpResponse.json({ ...margherita, ...body })
    }),
  )
  const screen = await renderRoute('/recipes/1/edit')
  await expect
    .element(screen.getByRole('textbox', { name: 'Ingredients' }))
    .toHaveValue('Pizza dough\nTomato sauce')

  await screen.getByRole('textbox', { name: 'Name' }).fill('Margherita')
  await screen.getByRole('checkbox', { name: 'Lunch' }).click()
  await screen.getByRole('button', { name: 'Save' }).click()

  await expect.element(screen.getByRole('heading', { level: 1, name: 'Margherita' })).toBeVisible()
  await expect.element(screen.getByText('Dinner, Lunch')).toBeVisible()
  await expect.element(screen.getByRole('dialog', { name: 'Recipe saved' })).toBeVisible()
  expect(changes).toMatchObject({
    name: 'Margherita',
    // Not the API's 'Effortless': the form offers only the difficulties it knows
    difficulty: 'Easy',
    mealType: ['Dinner', 'Lunch'],
    tags: ['Pizza', 'Italian'],
  })
})

test('a server error shows in the recipe form, not in a toast, and keeps the form', async () => {
  worker.use(
    margheritaHandler(),
    http.patch('*/recipes/1', () =>
      HttpResponse.json({ message: 'Name is already taken' }, { status: 409 }),
    ),
  )
  const screen = await renderRoute('/recipes/1/edit')

  await screen.getByRole('textbox', { name: 'Name' }).fill('Pizza')
  await screen.getByRole('button', { name: 'Save' }).click()

  await expect
    .element(screen.getByRole('alert').filter({ hasText: 'Name is already taken' }))
    .toBeVisible()
  await expect.element(screen.getByText('Something went wrong')).not.toBeInTheDocument()
  await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Pizza')
  await expect.element(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
})
