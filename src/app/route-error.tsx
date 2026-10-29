import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router'
import { SchemaValidationError } from 'ky'
import { TriangleAlertIcon } from 'lucide-react'
import { useEffect } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

// ky's message for a schema mismatch names no field, so a stale test fixture is hard to find
function getDevMessage(error: Error) {
  if (!(error instanceof SchemaValidationError)) return error.message
  const issues = error.issues.map((issue) => {
    const path = issue.path?.map((segment) =>
      String(typeof segment === 'object' ? segment.key : segment),
    )
    return `${path?.join('.')}: ${issue.message}`
  })
  return `${error.message}. ${issues.join('. ')}`
}

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <div className='flex flex-1'>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>
            <h1>Something went wrong</h1>
          </EmptyTitle>
          <EmptyDescription>
            {import.meta.env.DEV && error instanceof Error
              ? getDevMessage(error)
              : 'An unexpected error occurred. Try again.'}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className='flex gap-2'>
            <Button onClick={() => router.invalidate()}>Try again</Button>
            <Link to='/' className={buttonVariants({ variant: 'outline' })}>
              Go home
            </Link>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
