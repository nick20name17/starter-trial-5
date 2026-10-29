import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod/mini'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/api'

import { signInMutationOptions } from './auth-queries'

const route = getRouteApi('/sign-in')

const signInFormSchema = z.object({
  username: z.string().check(z.trim(), z.minLength(1, 'Enter your username')),
  password: z.string().check(z.minLength(1, 'Enter your password')),
})

export function SignInPage() {
  const { redirect } = route.useSearch()
  const router = useRouter()
  const mutation = useMutation({ ...signInMutationOptions(), meta: { errorToast: false } })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = handleSubmit((credentials) => {
    mutation.mutate(credentials, {
      onSuccess: () => {
        void router.navigate({ href: redirect ?? '/', replace: true })
      },
    })
  })

  return (
    <div className='mx-auto flex w-full max-w-sm flex-col gap-4 p-6'>
      <h1 className='font-medium'>Sign in</h1>
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <Field data-invalid={!!errors.username}>
            <FieldLabel htmlFor='sign-in-username'>Username</FieldLabel>
            <Input
              id='sign-in-username'
              autoComplete='username'
              aria-invalid={!!errors.username}
              {...register('username')}
            />
            <FieldError errors={[errors.username]} />
          </Field>
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor='sign-in-password'>Password</FieldLabel>
            <Input
              id='sign-in-password'
              type='password'
              autoComplete='current-password'
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          {mutation.isError && <FieldError>{getErrorMessage(mutation.error)}</FieldError>}
          <Button type='submit' pending={mutation.isPending}>
            Sign in
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
