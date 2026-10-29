import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { RecipeForm } from './recipe-form'
import { recipeQueryOptions, recipeUpdateMutationOptions } from './recipes-queries'

const route = getRouteApi('/_authed/recipes/$recipeId/edit')

export function RecipeEditPage() {
  const { recipeId } = route.useParams()
  const navigate = route.useNavigate()
  const { data: recipe } = useSuspenseQuery(recipeQueryOptions(recipeId))
  const mutation = useMutation({
    ...recipeUpdateMutationOptions(recipeId),
    meta: { errorToast: false },
  })

  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-4 p-6'>
      <h1 className='font-medium'>Edit recipe</h1>
      <RecipeForm
        recipe={recipe}
        submitLabel='Save'
        pending={mutation.isPending}
        error={mutation.error}
        cancel={
          <Link
            to='/recipes/$recipeId'
            params={{ recipeId }}
            className={buttonVariants({ variant: 'outline' })}
          >
            Cancel
          </Link>
        }
        onSubmit={(changes) => {
          mutation.mutate(changes, {
            onSuccess: () => {
              toast.add({ type: 'success', title: 'Recipe saved' })
              void navigate({ to: '/recipes/$recipeId', params: { recipeId } })
            },
          })
        }}
      />
    </div>
  )
}
