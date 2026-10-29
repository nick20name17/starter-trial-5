import { defineConfig, devices } from '@playwright/test'

const port = 4173

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Builds first, so a direct playwright run never tests a stale dist
    command: `bunx vite build && bunx vite preview --port ${port} --strictPort`,
    // With port instead of url, Playwright sets baseURL itself
    port,
  },
})
