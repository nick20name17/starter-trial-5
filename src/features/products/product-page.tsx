import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'

import { productQueryOptions } from './products-queries'

const route = getRouteApi('/_authed/products/$productId/')
const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function ProductPage() {
  const { productId } = route.useParams()
  const { data: product } = useSuspenseQuery(productQueryOptions(productId))

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col items-start gap-4 p-6'>
      <Link to='/products' className={buttonVariants({ variant: 'outline' })}>
        <ArrowLeftIcon data-icon='inline-start' />
        All products
      </Link>
      <img
        src={product.thumbnail}
        alt={product.title}
        width={192}
        height={192}
        className='size-48 rounded-md border object-cover'
      />
      <h1 className='font-medium'>{product.title}</h1>
      <p className='text-sm'>{priceFormat.format(product.price)}</p>
      <p className='text-sm text-muted-foreground'>{product.description}</p>
      <Link
        to='/products/$productId/edit'
        params={{ productId }}
        className={buttonVariants({ variant: 'outline' })}
      >
        Edit
      </Link>
    </div>
  )
}
