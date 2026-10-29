import { parseEnv } from '@/lib/env-schema'

export const env = parseEnv(import.meta.env)
