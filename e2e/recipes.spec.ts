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

test('creates a recipe with the real API and opens it', async ({ page }) => {
  await page.goto('/recipes')
  await page.getByRole('link', { name: 'New recipe' }).click()

  await page.getByRole('textbox', { name: 'Name' }).fill('Shakshuka')
  await page.getByRole('textbox', { name: 'Cuisine' }).fill('Tunisian')
  await page.getByRole('checkbox', { name: 'Breakfast' }).click()
  await page.getByRole('spinbutton', { name: 'Servings' }).fill('2')
  await page.getByRole('textbox', { name: 'Ingredients' }).fill('4 eggs\nTomatoes')
  await page.getByRole('textbox', { name: 'Instructions' }).fill('Simmer.\nAdd eggs.')
  await page.getByRole('button', { name: 'Create recipe' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Shakshuka' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Tomatoes' })).toBeVisible()
})

test('edits a recipe with the real API', async ({ page }) => {
  await page.goto('/recipes/1')
  await page.getByRole('link', { name: 'Edit' }).click()

  await page.getByRole('textbox', { name: 'Name' }).fill('Margherita Pizza')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Margherita Pizza' })).toBeVisible()
})

test('deletes a recipe with the real API after confirming', async ({ page }) => {
  await page.goto('/recipes/2')
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Recipes' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Recipe deleted' })).toBeVisible()
})

test.describe('unknown recipe', () => {
  test.use({ expectedHttpErrors: [{ url: /\/recipes\/0$/, status: 404 }] })

  test('shows the not found page when the real API answers 404', async ({ page }) => {
    await page.goto('/recipes/0')

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
