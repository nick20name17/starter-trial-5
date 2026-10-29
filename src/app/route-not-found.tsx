import { Link } from '@tanstack/react-router'
import { FileQuestionIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function RouteNotFound() {
  return (
    <div className='flex flex-1'>
      <title>Page not found</title>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <FileQuestionIcon />
          </EmptyMedia>
          <EmptyTitle>
            <h1>Page not found</h1>
          </EmptyTitle>
          <EmptyDescription>
            The page you’re looking for doesn’t exist or has been moved.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link to='/' className={buttonVariants()}>
            Go home
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}
