import { HttpResponse, isCommonAssetRequest } from 'msw'
import { HttpNetworkFrame } from 'msw/experimental'
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest'

import { stopApp } from '@/test/render'
import { worker } from '@/test/worker'

const consoleError = vi.spyOn(console, 'error').mockName('console.error')

afterEach(() => {
  expect(
    consoleError,
    'If the test expects the error (React logs every error a boundary catches), assert it, then call vi.mocked(console.error).mockClear()',
  ).not.toHaveBeenCalled()
})

beforeAll(() =>
  worker.start({
    // Like the 'error' strategy, but asset URLs fail too, except the dev server's modules and fonts
    onUnhandledFrame: ({ frame, defaults }) => {
      if (!(frame instanceof HttpNetworkFrame)) {
        defaults.error()
        throw new Error('No handler for this frame: add one with worker.use')
      }
      const { request } = frame.data
      if (new URL(request.url).origin === location.origin && isCommonAssetRequest(request)) return
      defaults.error()
      // defaults.error() only logs: without a response the request reaches the real server.
      // A 501 is not retried, and the app's error UI shows the message
      frame.respondWith(
        HttpResponse.json(
          { message: `No handler for ${request.method} ${request.url}: add one with worker.use` },
          { status: 501 },
        ),
      )
    },
    quiet: true,
  }),
)
afterEach(async () => {
  await stopApp()
  worker.resetHandlers()
  localStorage.clear()
})
afterAll(() => worker.stop())
