import { useMatch } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { clearSession } from '@/lib/session'

export function UserMenu() {
  const user = useMatch({
    from: '/_authed',
    shouldThrow: false,
    select: (match) => match.context.user,
  })
  if (!user) return null

  return (
    <div className='flex items-center gap-2'>
      <p className='text-sm'>{`${user.firstName} ${user.lastName}`}</p>
      {/* The _authed layout hears the change and sends the user to sign in */}
      <Button variant='outline' onClick={clearSession}>
        Sign out
      </Button>
    </div>
  )
}
