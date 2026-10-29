import { AxeBuilder } from '@axe-core/playwright'
import { expect, test as base } from '@playwright/test'
import { loadEnv } from 'vite'

import { parseEnv } from '../src/lib/env-schema.ts'
import { SESSION_STORAGE_KEY, sessionSchema } from '../src/lib/session-schema.ts'

export { expect }

interface ExpectedHttpError {
  url: RegExp
  status: number
}

// DummyJSON's public demo user
export const demoUser = { username: 'emilys', password: 'emilyspass' }

interface Fixtures {
  signedIn: boolean
  expectedHttpErrors: ExpectedHttpError[]
  slowNetwork: void
  pageErrors: void
  httpErrors: void
  axe: void
  layoutShifts: void
}

export const test = base.extend<Fixtures>({
  signedIn: [false, { option: true }],
  // storageState, not addInitScript: an init script runs on every load, so it would sign the user
  // in again after a test signs out
  storageState: [
    async ({ storageState, signedIn, baseURL, playwright }, use) => {
      if (!signedIn || !baseURL) return use(storageState)
      // vite build's mode: the same API the built app calls
      const { VITE_API_URL } = parseEnv(loadEnv('production', process.cwd(), 'VITE_'))
      const api = await playwright.request.newContext()
      const response = await api.post(new URL(`${VITE_API_URL}/auth/login`, baseURL).href, {
        data: demoUser,
      })
      expect(response.ok(), `Sign-in failed with ${response.status()}`).toBe(true)
      // parse also drops the user fields the login response carries
      const session = JSON.stringify(sessionSchema.parse(await response.json()))
      await api.dispose()
      await use({
        cookies: [],
        origins: [
          { origin: baseURL, localStorage: [{ name: SESSION_STORAGE_KEY, value: session }] },
        ],
      })
    },
    { scope: 'test' },
  ],
  expectedHttpErrors: [[], { option: true }],
  // Chrome ignores a shift within 500 ms of input, so a fast API hid shifts locally that failed CI.
  // 800 ms makes them fail locally too. Only the API is slowed: CI serves the app locally as well
  slowNetwork: [
    async ({ page, baseURL }, use) => {
      // oxlint-disable-next-line no-restricted-properties -- delays requests to the real API, mocks nothing
      await page.route(
        (url) => url.origin !== baseURL,
        async (route) => {
          await new Promise((resolve) => {
            setTimeout(resolve, 800)
          })
          await route.continue()
        },
      )
      await use()
    },
    { auto: true },
  ],
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        // Chrome's text for a 4xx or 5xx has no URL; httpErrors reports it with the URL
        if (message.text().startsWith('Failed to load resource: the server responded')) return
        if (message.type() === 'error') errors.push(message.text())
      })
      await use()
      expect(
        errors,
        'Uncaught errors and console.error on the page. If the test expects them, move it to Vitest: e2e has no opt-out',
      ).toEqual([])
    },
    { auto: true },
  ],
  httpErrors: [
    async ({ page, expectedHttpErrors }, use) => {
      const unexpected: string[] = []
      const received = new Set<ExpectedHttpError>()
      page.on('response', (response) => {
        if (response.status() < 400) return
        const expected = expectedHttpErrors.find(
          ({ url, status }) => status === response.status() && url.test(response.url()),
        )
        if (expected) received.add(expected)
        else unexpected.push(`${response.status()} ${response.url()}`)
      })
      await use()
      expect(
        unexpected,
        'HTTP errors the test did not expect. If it does, add them with test.use({ expectedHttpErrors })',
      ).toEqual([])
      expect(
        expectedHttpErrors
          .filter((expected) => !received.has(expected))
          .map(({ url, status }) => `${status} ${url}`),
        'Expected HTTP errors that never came',
      ).toEqual([])
    },
    { auto: true },
  ],
  axe: [
    async ({ page }, use) => {
      await use()
      const testOpenedAPage = page.url() !== 'about:blank'
      if (!testOpenedAPage) return
      const { violations } = await new AxeBuilder({ page }).analyze()
      const failures = violations.flatMap((violation) =>
        violation.nodes.map(
          (node) => `${violation.id} at ${node.target.join(' ')}: ${node.failureSummary}`,
        ),
      )
      expect(failures, 'axe accessibility violations on the final page').toEqual([])
    },
    { auto: true },
  ],
  // Any shift fails: under a CLS budget small shifts add up unnoticed.
  // CDP, not a PerformanceObserver: an observer loses the shifts of a page the test left
  layoutShifts: [
    async ({ page }, use) => {
      const cdp = await page.context().newCDPSession(page)
      const shifts: Promise<string>[] = []
      cdp.on('PerformanceTimeline.timelineEventAdded', ({ event }) => {
        const shift = event.layoutShiftDetails
        if (!shift || shift.hadRecentInput) return
        const nodes = shift.sources.map(({ nodeId }) =>
          cdp.send('DOM.getOuterHTML', { backendNodeId: nodeId }).then(
            ({ outerHTML }) => outerHTML.slice(0, 120),
            () => 'a removed node',
          ),
        )
        shifts.push(
          Promise.all(nodes).then(
            (html) => `Shift of ${shift.value}: ${html.join(', ') || 'no sources'}`,
          ),
        )
      })
      await cdp.send('PerformanceTimeline.enable', { eventTypes: ['layout-shift'] })
      await use()
      // Chromium reports a shift a frame late: wait two frames for the last step's shift
      if (!page.isClosed()) {
        await page.evaluate(
          'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
        )
      }
      expect(await Promise.all(shifts), 'Layout shifts without user input').toEqual([])
    },
    { auto: true },
  ],
})
