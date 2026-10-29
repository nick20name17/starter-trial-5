import { z } from 'zod/mini'

const envSchema = z.object({
  VITE_API_URL: z.union(
    [z.url({ protocol: /^https?$/ }), z.string().check(z.regex(/^\/(?!\/)\S*$/))],
    {
      error:
        'Must be an http(s) URL or a path that starts with a single / (// points to another origin)',
    },
  ),
})

// Apart from env.ts: vite.config.ts runs this in Node, where import.meta.env is undefined
export function parseEnv(source: Record<string, unknown>) {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    throw new Error(
      `Invalid environment variables (see .env.example):\n${z.prettifyError(result.error)}`,
    )
  }
  return result.data
}
