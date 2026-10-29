import { z } from 'zod/mini'

// Apart from session.ts: e2e stores a session from Node, where localStorage is undefined
export const SESSION_STORAGE_KEY = 'session'

export const sessionSchema = z.object({ accessToken: z.string(), refreshToken: z.string() })

export type Session = z.infer<typeof sessionSchema>
