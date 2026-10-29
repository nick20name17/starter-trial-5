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
  await page.goto('/recipes')
  await page.getByRole('textbox', { name: 'Username' }).fill(demoUser.username)
  await page.getByLabel('Password').fill(demoUser.password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('searchbox', { name: 'Search recipes' })).toBeVisible()
  await expect(page).toHaveURL(/\/recipes$/)

  await page.getByRole('button', { name: 'Sign out' }).click()

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})
