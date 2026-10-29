import { setupWorker } from 'msw/browser'

// No default handlers: a test declares the responses it depends on with worker.use
export const worker = setupWorker()
