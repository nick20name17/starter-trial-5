import { expect, test } from 'vitest'

import { renderRoute } from '@/test/render'

test('Go home on the not found page opens the home page', async () => {
  const screen = await renderRoute('/does-not-exist')

  await screen.getByRole('link', { name: 'Go home' }).click()

  await expect.poll(() => screen.router.state.resolvedLocation?.pathname).toBe('/')
})
