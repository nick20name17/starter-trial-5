import { demoUser, expect, test } from './fixtures.ts'

test('unknown URL shows the not found page', async ({ page }) => {
  await page.goto('/does-not-exist')

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page).toHaveTitle('Page not found')
})

test.describe('theme', () => {
  test.use({ colorScheme: 'dark' })

  test('follows the system color scheme', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })

  test('stored theme overrides the system one', async ({ page }) => {
    await page.addInitScript("localStorage.setItem('theme', 'light')")
    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(/\blight\b/)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff')
  })
})

test('signing in with the real API opens the page the user first asked for', async ({ page }) => {
  await page.goto('/products')
  await page.getByRole('textbox', { name: 'Username' }).fill(demoUser.username)
  await page.getByLabel('Password').fill(demoUser.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('searchbox', { name: 'Search products' })).toBeVisible()
  await expect(page).toHaveURL(/\/products$/)

  await page.getByRole('button', { name: 'Sign out' }).click()

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test.describe('products example', () => {
  test.use({ signedIn: true })

  test('searches the real API and opens a product', async ({ page }) => {
    await page.goto('/products')
    // Both results are on page 1, so the search moves them to the top
    await expect(page.getByRole('link', { name: /^Annibale Colombo Sofa/ })).toBeVisible()

    await page.getByRole('searchbox', { name: 'Search products' }).fill('Annibale Colombo')
    await page.keyboard.press('Enter')
    await expect(page.getByText('Page 1 of 1', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: /^Annibale Colombo Sofa/ }).click()

    await expect(
      page.getByRole('heading', { level: 1, name: 'Annibale Colombo Sofa' }),
    ).toBeVisible()
  })

  test.describe('unknown product', () => {
    test.use({ expectedHttpErrors: [{ url: /\/products\/0$/, status: 404 }] })

    test('shows the not found page when the real API answers 404', async ({ page }) => {
      await page.goto('/products/0')

      await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    })
  })
})
