import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod/mini'

import { Button, buttonVariants } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/api'

import { productQueryOptions, productUpdateMutationOptions } from './products-queries'

const route = getRouteApi('/_authed/products/$productId/edit')

const productFormSchema = z.object({
  title: z.string().check(z.trim(), z.minLength(1, 'Enter a title')),
  price: z.number('Enter a price').check(z.positive('Enter a price above 0')),
})

export function ProductEditPage() {
  const { productId } = route.useParams()
  const navigate = route.useNavigate()
  const { data: product } = useSuspenseQuery(productQueryOptions(productId))
  const mutation = useMutation({
    ...productUpdateMutationOptions(productId),
    meta: { errorToast: false },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: { title: product.title, price: product.price },
  })

  const onSubmit = handleSubmit((changes) => {
    mutation.mutate(changes, {
      onSuccess: () => {
        toast.add({ type: 'success', title: 'Product saved' })
        void navigate({ to: '/products/$productId', params: { productId } })
      },
    })
  })

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-4 p-6'>
      <h1 className='font-medium'>Edit product</h1>
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor='product-title'>Title</FieldLabel>
            <Input id='product-title' aria-invalid={!!errors.title} {...register('title')} />
            <FieldError errors={[errors.title]} />
          </Field>
          <Field data-invalid={!!errors.price}>
            <FieldLabel htmlFor='product-price'>Price</FieldLabel>
            <Input
              id='product-price'
              type='number'
              step='any'
              aria-invalid={!!errors.price}
              {...register('price', { valueAsNumber: true })}
            />
            <FieldError errors={[errors.price]} />
          </Field>
          {mutation.isError && <FieldError>{getErrorMessage(mutation.error)}</FieldError>}
          <Field orientation='horizontal'>
            <Button type='submit' pending={mutation.isPending}>
              Save
            </Button>
            <Link
              to='/products/$productId'
              params={{ productId }}
              className={buttonVariants({ variant: 'outline' })}
            >
              Cancel
            </Link>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
