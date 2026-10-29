import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { setSession } from '@/lib/session'
import { margherita, margheritaHandler } from '@/test/recipes'
import { renderRoute, signedInSession, signedInUser } from '@/test/render'
import { worker } from '@/test/worker'

test('signing in opens the page the user first asked for', async () => {
  let credentials: unknown
  worker.use(
    http.post('*/auth/login', async ({ request }) => {
      credentials = await request.json()
      return HttpResponse.json({ ...signedInUser, ...signedInSession })
    }),
    margheritaHandler(),
  )
  const screen = await renderRoute('/recipes/1', { signedIn: false })

  await screen.getByRole('textbox', { name: 'Username' }).fill(' emilys ')
  await screen.getByLabelText('Password').fill('emilyspass')
  await screen.getByRole('button', { name: 'Sign in' }).click()

  await expect
    .element(screen.getByRole('heading', { level: 1, name: 'Classic Margherita Pizza' }))
    .toBeVisible()
  await expect.element(screen.getByText('Emily Johnson')).toBeVisible()
  expect(screen.router.state.location.pathname).toBe('/recipes/1')
  expect(credentials).toEqual({ username: 'emilys', password: 'emilyspass' })
})

test('wrong credentials show in the form, not in a toast', async () => {
  worker.use(
    http.post('*/auth/login', () =>
      HttpResponse.json({ message: 'Invalid credentials' }, { status: 400 }),
    ),
  )
  const screen = await renderRoute('/sign-in', { signedIn: false })

  await screen.getByRole('textbox', { name: 'Username' }).fill('emilys')
  await screen.getByLabelText('Password').fill('wrong')
  await screen.getByRole('button', { name: 'Sign in' }).click()

  await expect
    .element(screen.getByRole('alert').filter({ hasText: 'Invalid credentials' }))
    .toBeVisible()
  await expect.element(screen.getByText('Something went wrong')).not.toBeInTheDocument()
})

test('signing out opens the sign-in page', async () => {
  worker.use(margheritaHandler())
  const screen = await renderRoute('/recipes/1')

  await screen.getByRole('button', { name: 'Sign out' }).click()

  await expect.element(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await expect.element(screen.getByText('Emily Johnson')).not.toBeInTheDocument()
})

test('a session the API no longer accepts opens the sign-in page, not an error', async () => {
  setSession(signedInSession)
  worker.use(
    http.get('*/auth/me', () =>
      HttpResponse.json({ message: 'Invalid/Expired Token!' }, { status: 401 }),
    ),
    http.post('*/auth/refresh', () =>
      HttpResponse.json({ message: 'Invalid refresh token' }, { status: 403 }),
    ),
  )
  const screen = await renderRoute('/recipes/1', { signedIn: false })

  await expect.element(screen.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

// %09 is a tab: URL parsers drop it, so /<tab>/evil.example reads as //evil.example
test.each(['//evil.example', '/%5C/evil.example', '/%09/evil.example'])(
  'a signed-in user sent to sign in with redirect=%s stays on this site',
  async (redirect) => {
    const screen = await renderRoute(`/sign-in?redirect=${redirect}`)

    await expect.poll(() => screen.router.state.location.pathname).toBe('/')
  },
)

test('a token refresh during a save keeps the page and the signed-in user', async () => {
  let meRequests = 0
  setSession(signedInSession)
  worker.use(
    http.get('*/auth/me', () => {
      meRequests += 1
      return HttpResponse.json(signedInUser)
    }),
    margheritaHandler(),
    http.patch(
      '*/recipes/1',
      () => HttpResponse.json({ message: 'Invalid/Expired Token!' }, { status: 401 }),
      { once: true },
    ),
    http.patch('*/recipes/1', () => HttpResponse.json(margherita)),
    http.post('*/auth/refresh', () =>
      HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' }),
    ),
  )
  const screen = await renderRoute('/recipes/1/edit', { signedIn: false })

  await screen.getByRole('button', { name: 'Save' }).click()

  await expect.element(screen.getByRole('dialog', { name: 'Recipe saved' })).toBeVisible()
  expect(meRequests).toBe(1)
})
