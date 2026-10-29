import { expect, test } from './fixtures.ts'

test.use({ signedIn: true })

test('filters, sorts and searches the real recipe list, then opens a recipe', async ({ page }) => {
  await page.goto('/recipes')
  await expect(page.getByText('Page 1 of 5', { exact: true })).toBeVisible()

  await page.getByRole('combobox', { name: 'Meal' }).click()
  await page.getByRole('option', { name: 'Snack' }).click()
  await expect(page.getByText('Page 1 of 1', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Sort by' }).click()
  await page.getByRole('option', { name: 'Top rated' }).click()
  await page.getByRole('searchbox', { name: 'Search recipes' }).fill('cookies')
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/recipes\?mealType=Snack&sort=rating&q=cookies$/)
  await page.getByRole('link', { name: /^Chocolate Chip Cookies/ }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Chocolate Chip Cookies' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible()
})

test.describe('unknown recipe', () => {
  test.use({ expectedHttpErrors: [{ url: /\/recipes\/0$/, status: 404 }] })

  test('shows the not found page when the real API answers 404', async ({ page }) => {
    await page.goto('/recipes/0')

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
