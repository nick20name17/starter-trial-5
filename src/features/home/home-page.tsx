import { Link } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'

export function HomePage() {
  return (
    <div className='flex flex-1 flex-col items-start gap-4 p-6'>
      <h1 className='font-medium'>{import.meta.env.APP_NAME}</h1>
      <Link to='/recipes' className={buttonVariants()}>
        Browse recipes
      </Link>
    </div>
  )
}
