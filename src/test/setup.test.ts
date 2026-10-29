import { expect, test, vi } from 'vitest'

test('a request without a handler gets a 501 that names it instead of reaching the network', async () => {
  const response = await fetch('/no-handler')

  expect(response.status).toBe(501)
  expect(await response.json()).toEqual({
    message: `No handler for GET ${location.origin}/no-handler: add one with worker.use`,
  })
  expect(console.error).toHaveBeenCalledWith(expect.stringContaining('GET /no-handler'))
  vi.mocked(console.error).mockClear()
})
