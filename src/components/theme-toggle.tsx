import { MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button variant='ghost' size='icon' aria-label='Toggle theme' onClick={toggleTheme}>
      <SunIcon className='hidden dark:block' />
      <MoonIcon className='dark:hidden' />
    </Button>
  )
}
