import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { z } from 'zod/mini'

import {
  ThemeProviderContext,
  themeSchema,
  type ResolvedTheme,
  type Theme,
} from '@/hooks/use-theme'

interface ThemeProviderProps {
  children: ReactNode
}

// Keep in sync with the inline script in index.html
const STORAGE_KEY = 'theme'
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#ffffff',
  dark: '#0a0a0a',
}
const storedThemeSchema = z.catch(themeSchema, 'system')

function readStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // The theme still applies for this session
  }
}

const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')

function subscribeToSystemTheme(onChange: () => void) {
  darkSchemeQuery.addEventListener('change', onChange)
  return () => darkSchemeQuery.removeEventListener('change', onChange)
}

function getSystemTheme(): ResolvedTheme {
  return darkSchemeQuery.matches ? 'dark' : 'light'
}

function disableTransitionsTemporarily() {
  const style = document.createElement('style')
  style.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(style)

  return () => {
    window.getComputedStyle(document.body)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove()
      })
    })
  }
}

function applyTheme(theme: ResolvedTheme) {
  const restoreTransitions = disableTransitionsTemporarily()

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme])

  restoreTransitions()
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState(() => storedThemeSchema.parse(readStoredTheme()))
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  function setTheme(nextTheme: Theme) {
    writeStoredTheme(nextTheme)
    setThemeState(nextTheme)
  }

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  return (
    <ThemeProviderContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
