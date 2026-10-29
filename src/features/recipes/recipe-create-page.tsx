import { useMutation } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { RecipeForm } from './recipe-form'
import { recipeCreateMutationOptions } from './recipes-queries'

const route = getRouteApi('/_authed/recipes/new')

export function RecipeCreatePage() {
  const navigate = route.useNavigate()
  const mutation = useMutation({ ...recipeCreateMutationOptions(), meta: { errorToast: false } })

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-4 p-6'>
      <h1 className='font-medium'>New recipe</h1>
      <RecipeForm
        submitLabel='Create recipe'
        pending={mutation.isPending}
        error={mutation.error}
        cancel={
          <Link to='/recipes' className={buttonVariants({ variant: 'outline' })}>
            Cancel
          </Link>
        }
        onSubmit={(recipe) => {
          mutation.mutate(recipe, {
            onSuccess: ({ id }) => {
              toast.add({ type: 'success', title: 'Recipe created' })
              void navigate({ to: '/recipes/$recipeId', params: { recipeId: String(id) } })
            },
          })
        }}
      />
    </div>
  )
}
