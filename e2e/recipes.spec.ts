import { expect, test } from './fixtures.ts'

test.use({ signedIn: true })

test('filters, sorts and searches the real recipe list', async ({ page }) => {
  await page.goto('/recipes')
  await expect(page.getByText('Page 1 of 5', { exact: true })).toBeVisible()

  await page.getByRole('combobox', { name: 'Meal' }).click()
  await page.getByRole('option', { name: 'Snack' }).click()
  await expect(page.getByText('Page 1 of 1', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Sort by' }).click()
  await page.getByRole('option', { name: 'Top rated' }).click()
  await page.getByRole('searchbox', { name: 'Search recipes' }).fill('cookies')
  await page.keyboard.press('Enter')

  await expect(page.getByText('Chocolate Chip Cookies')).toBeVisible()
  await expect(page).toHaveURL(/\/recipes\?mealType=Snack&sort=rating&q=cookies$/)
})
