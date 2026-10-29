import { expect, test } from 'vitest'

import { renderRoute } from '@/test/render'

test('theme toggle switches a light page to dark and remembers it', async () => {
  const screen = await renderRoute('/')

  await screen.getByRole('button', { name: 'Toggle theme' }).click()

  await expect.element(document.documentElement).toHaveClass('dark')
  expect(localStorage.getItem('theme')).toBe('dark')
})
