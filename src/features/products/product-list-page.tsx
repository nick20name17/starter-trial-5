import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useDeferredValue, useState, type SubmitEvent } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

import { PRODUCTS_PER_PAGE, productListQueryOptions } from './products-queries'

const route = getRouteApi('/_authed/products/')
const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function ProductListPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  // The search whose list is on screen: React keeps it while the list of the next one loads
  const listSearch = useDeferredValue(search)
  const { data } = useSuspenseQuery(productListQueryOptions(listSearch))
  const [query, setQuery] = useState(search.q)
  const [urlQuery, setUrlQuery] = useState(search.q)
  const pageCount = Math.ceil(data.total / PRODUCTS_PER_PAGE)

  // Back and forward change q, so the field follows the URL. A submit keeps the text and focus
  if (search.q !== urlQuery) {
    setUrlQuery(search.q)
    setQuery(search.q)
  }

  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void navigate({ search: (prev) => ({ ...prev, q: query.trim(), page: 1 }) })
  }

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-6 p-6'>
      <h1 className='font-medium'>Products</h1>
      <search>
        <form className='flex gap-2' onSubmit={handleSearch}>
          <Input
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search products'
            aria-label='Search products'
          />
          <Button type='submit' pending={search.q !== listSearch.q}>
            Search
          </Button>
        </form>
      </search>
      {data.products.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No products found</EmptyTitle>
            <EmptyDescription>Try a different search.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {/* Above the list: a search can shorten the list and shift a nav below it */}
          <nav aria-label='Pagination' className='flex items-center gap-2'>
            {/* One text node: a page number of a new width would shift a separate node after it */}
            <p className='mr-auto text-sm'>{`Page ${listSearch.page} of ${pageCount}`}</p>
            {/* Disabled, not hidden: a button that appears after the API answers shifts the rest */}
            {search.page > 1 ? (
              <Link
                from='/products/'
                to='/products'
                search={(prev) => ({ ...prev, page: prev.page - 1 })}
                className={buttonVariants({ variant: 'outline' })}
              >
                Previous
              </Link>
            ) : (
              <Button variant='outline' disabled>
                Previous
              </Button>
            )}
            {search.page < pageCount ? (
              <Link
                from='/products/'
                to='/products'
                search={(prev) => ({ ...prev, page: prev.page + 1 })}
                className={buttonVariants({ variant: 'outline' })}
              >
                Next
              </Link>
            ) : (
              <Button variant='outline' disabled>
                Next
              </Button>
            )}
          </nav>
          {/* New rows per search: moving old rows after the API answers is a layout shift */}
          <ItemGroup key={`${listSearch.q} ${listSearch.page}`}>
            {data.products.map((product) => (
              <li key={product.id}>
                <Item
                  variant='outline'
                  render={
                    <Link to='/products/$productId' params={{ productId: String(product.id) }} />
                  }
                >
                  <ItemMedia variant='image'>
                    <img src={product.thumbnail} alt='' width={32} height={32} />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{product.title}</ItemTitle>
                    <ItemDescription>{priceFormat.format(product.price)}</ItemDescription>
                  </ItemContent>
                </Item>
              </li>
            ))}
          </ItemGroup>
        </>
      )}
    </div>
  )
}
