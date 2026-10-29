import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

import { testImage } from '@/test/image'
import { lashMascara, lashMascaraHandler } from '@/test/products'
import { renderRoute } from '@/test/render'
import { worker } from '@/test/worker'

function echoSearch({ request }: { request: Request }) {
  const params = new URL(request.url).searchParams
  return HttpResponse.json({
    products: [
      {
        id: 1,
        title: `q=${params.get('q')} skip=${params.get('skip')}`,
        price: 9.99,
        thumbnail: testImage,
      },
    ],
    total: 30,
  })
}

function productSearchEchoHandler() {
  return http.get('*/products/search', echoSearch)
}

// Answers the next search only once the test releases it
function heldSearchHandler(release: Promise<void>) {
  return http.get(
    '*/products/search',
    async (info) => {
      await release
      return echoSearch(info)
    },
    { once: true },
  )
}

test('product list opens the next page', async () => {
  worker.use(productSearchEchoHandler())
  const screen = await renderRoute('/products')

  await expect.element(screen.getByRole('link', { name: 'q= skip=0 $9.99' })).toBeVisible()
  await expect.element(screen.getByText('Page 1 of 3')).toBeVisible()

  await screen.getByRole('link', { name: 'Next' }).click()

  await expect.element(screen.getByRole('link', { name: 'q= skip=12 $9.99' })).toBeVisible()
  await expect.element(screen.getByText('Page 2 of 3')).toBeVisible()
})

test('a search loads from the first page and keeps the page on screen, with focus in the field', async () => {
  const release = Promise.withResolvers<void>()
  worker.use(productSearchEchoHandler())
  const screen = await renderRoute('/products?page=2')
  await expect.element(screen.getByRole('link', { name: 'q= skip=12 $9.99' })).toBeVisible()
  worker.use(heldSearchHandler(release.promise))
  const searchbox = screen.getByRole('searchbox', { name: 'Search products' })

  await searchbox.fill('phone')
  await userEvent.keyboard('{Enter}')
  // The router replaces a page that loads longer than its pendingMs, 1 s, with a spinner
  await new Promise((resolve) => {
    setTimeout(resolve, 1100)
  })

  await expect.element(screen.getByRole('link', { name: 'q= skip=12 $9.99' })).toBeVisible()
  release.resolve()
  await expect.element(screen.getByRole('link', { name: 'q=phone skip=0 $9.99' })).toBeVisible()
  await expect.element(searchbox).toHaveFocus()
})

test('the next page keeps a search that is still loading', async () => {
  const release = Promise.withResolvers<void>()
  worker.use(productSearchEchoHandler())
  const screen = await renderRoute('/products')
  await expect.element(screen.getByRole('link', { name: 'q= skip=0 $9.99' })).toBeVisible()
  worker.use(heldSearchHandler(release.promise))

  await screen.getByRole('searchbox', { name: 'Search products' }).fill('phone')
  await userEvent.keyboard('{Enter}')
  await screen.getByRole('link', { name: 'Next' }).click()
  release.resolve()

  await expect.element(screen.getByRole('link', { name: 'q=phone skip=12 $9.99' })).toBeVisible()
})

test('a q too long for a JS number keeps its digits in the API request and in links', async () => {
  worker.use(productSearchEchoHandler())
  const screen = await renderRoute('/products?q=723421968459640832')

  await expect
    .element(screen.getByRole('link', { name: 'q=723421968459640832 skip=0 $9.99' }))
    .toBeVisible()
  await expect
    .element(screen.getByRole('link', { name: 'Next' }))
    .toHaveAttribute('href', '/products?q=723421968459640832&page=2')
})

test('a page past the end opens the last page', async () => {
  worker.use(productSearchEchoHandler())
  const screen = await renderRoute('/products?page=99')

  await expect.element(screen.getByRole('link', { name: 'q= skip=24 $9.99' })).toBeVisible()
  await expect.element(screen.getByText('Page 3 of 3')).toBeVisible()
})

test('product page shows the product', async () => {
  worker.use(lashMascaraHandler())
  const screen = await renderRoute('/products/1')

  await expect
    .element(screen.getByRole('heading', { level: 1, name: 'Lash Mascara' }))
    .toBeVisible()
  await expect.element(screen.getByText('$9.99')).toBeVisible()
  await expect.poll(() => document.title).toBe('Lash Mascara')
})

test('product id stays one segment of the API path', async () => {
  worker.use(
    http.get('*/products/:productId', ({ request }) =>
      HttpResponse.json({ ...lashMascara, title: new URL(request.url).pathname }),
    ),
  )
  const screen = await renderRoute('/products/..%2Fusers')

  await expect
    .element(screen.getByRole('heading', { level: 1, name: '/products/..%2Fusers' }))
    .toBeVisible()
})

test('unknown product shows the not found page', async () => {
  worker.use(
    http.get('*/products/404', () =>
      HttpResponse.json({ message: "Product with id '404' not found" }, { status: 404 }),
    ),
  )
  const screen = await renderRoute('/products/404')

  await expect.element(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

test('saving the edit form shows the PATCH response, not a refetch', async () => {
  let changes: unknown
  worker.use(
    lashMascaraHandler(),
    http.patch('*/products/1', async ({ request }) => {
      changes = await request.json()
      return HttpResponse.json({ ...lashMascara, title: 'Lash Mascara Pro', price: 12.5 })
    }),
  )
  const screen = await renderRoute('/products/1/edit')

  await screen.getByRole('textbox', { name: 'Title' }).fill('  Lash Mascara Pro ')
  await screen.getByRole('spinbutton', { name: 'Price' }).fill('12.5')
  await screen.getByRole('button', { name: 'Save' }).click()

  await expect
    .element(screen.getByRole('heading', { level: 1, name: 'Lash Mascara Pro' }))
    .toBeVisible()
  await expect.element(screen.getByText('$12.50')).toBeVisible()
  await expect.element(screen.getByRole('dialog', { name: 'Product saved' })).toBeVisible()
  expect(changes).toEqual({ title: 'Lash Mascara Pro', price: 12.5 })
})

test('the Save button keeps its width while saving, so the Cancel link beside it stays put', async () => {
  const response = Promise.withResolvers<void>()
  worker.use(
    lashMascaraHandler(),
    http.patch('*/products/1', async () => {
      await response.promise
      return HttpResponse.json(lashMascara)
    }),
  )
  const screen = await renderRoute('/products/1/edit')
  // The element, not a locator: the spinner adds "Loading" to the button's name
  const save = await screen.getByRole('button', { name: 'Save' }).findElement()
  const widthBefore = save.getBoundingClientRect().width

  await userEvent.click(save)

  await expect.element(save).toBeDisabled()
  expect(save.getBoundingClientRect().width).toBe(widthBefore)
  response.resolve()
  await expect.element(screen.getByRole('dialog', { name: 'Product saved' })).toBeVisible()
})

test('the edit form shows field errors and sends nothing', async () => {
  let requests = 0
  worker.use(
    lashMascaraHandler(),
    http.patch('*/products/1', () => {
      requests += 1
      return HttpResponse.json(lashMascara)
    }),
  )
  const screen = await renderRoute('/products/1/edit')
  const title = screen.getByRole('textbox', { name: 'Title' })

  await title.fill('   ')
  await screen.getByRole('spinbutton', { name: 'Price' }).fill('')
  await screen.getByRole('button', { name: 'Save' }).click()

  await expect.element(screen.getByRole('alert').filter({ hasText: 'Enter a title' })).toBeVisible()
  await expect.element(screen.getByRole('alert').filter({ hasText: 'Enter a price' })).toBeVisible()
  await expect.element(title).toHaveAttribute('aria-invalid', 'true')

  await title.fill('Lash Mascara')
  await screen.getByRole('spinbutton', { name: 'Price' }).fill('0')
  await screen.getByRole('button', { name: 'Save' }).click()

  await expect.element(screen.getByText('Enter a title')).not.toBeInTheDocument()
  await expect
    .element(screen.getByRole('alert').filter({ hasText: 'Enter a price above 0' }))
    .toBeVisible()
  expect(requests).toBe(0)
})

test('a server error shows in the form, not in a toast, and keeps the form', async () => {
  worker.use(
    lashMascaraHandler(),
    http.patch('*/products/1', () =>
      HttpResponse.json({ message: 'Title is taken' }, { status: 409 }),
    ),
  )
  const screen = await renderRoute('/products/1/edit')

  await screen.getByRole('button', { name: 'Save' }).click()

  await expect
    .element(screen.getByRole('alert').filter({ hasText: 'Title is taken' }))
    .toBeVisible()
  await expect.element(screen.getByText('Something went wrong')).not.toBeInTheDocument()
  await expect.element(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Lash Mascara')
  await expect.element(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
})
