import { SESSION_STORAGE_KEY, type Session, sessionSchema } from '@/lib/session-schema'

const listeners = new Set<() => void>()

export function getSession(): Session | undefined {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!stored) return undefined
  try {
    // A value another build wrote, or one edited by hand, signs the user out instead of crashing
    const parsed = sessionSchema.safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

export function setSession(session: Session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  for (const listener of listeners) listener()
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
  for (const listener of listeners) listener()
}

// Also fires when another tab signs in or out: the storage event comes only from other tabs
export function subscribeSession(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === SESSION_STORAGE_KEY || event.key === null) listener()
  }
  listeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}
