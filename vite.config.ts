import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { msw } from 'msw/vite'
import { defineConfig } from 'vitest/config'

import { parseEnv } from './src/lib/env-schema.ts'

export default defineConfig(({ mode }) => ({
  plugins: [
    tanstackRouter({ autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    // worker-only mode still emits the worker into dist, so the plugin runs in tests only
    mode === 'test' && msw({ mode: 'worker-only' }),
    {
      name: 'validate-env',
      configResolved: (config) => {
        parseEnv(config.env)
      },
    },
  ],
  define: { 'import.meta.env.APP_NAME': JSON.stringify('Spa') },
  resolve: { tsconfigPaths: true },
  // A dep missing from a stale cache makes Vite reload mid-run and load React twice
  optimizeDeps: { force: mode === 'test' },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    // A request without a handler fails a test only once its wait for an element times out
    testTimeout: 5000,
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
}))
