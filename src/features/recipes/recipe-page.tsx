import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'

import { recipeQueryOptions } from './recipes-queries'

const route = getRouteApi('/_authed/recipes/$recipeId/')

export function RecipePage() {
  const { recipeId } = route.useParams()
  const { data: recipe } = useSuspenseQuery(recipeQueryOptions(recipeId))
  const facts = [
    { term: 'Prep', value: `${recipe.prepTimeMinutes} min` },
    { term: 'Cook', value: `${recipe.cookTimeMinutes} min` },
    { term: 'Servings', value: String(recipe.servings) },
    { term: 'Calories', value: `${recipe.caloriesPerServing} per serving` },
    { term: 'Difficulty', value: recipe.difficulty === 'unknown' ? '—' : recipe.difficulty },
    { term: 'Cuisine', value: recipe.cuisine },
    { term: 'Rating', value: `★ ${recipe.rating} (${recipe.reviewCount} reviews)` },
    { term: 'Meal', value: recipe.mealType.join(', ') || '—' },
  ]

  return (
    <article className='mx-auto flex w-full max-w-3xl flex-col items-start gap-6 p-6'>
      <div className='flex w-full gap-2'>
        <Link to='/recipes' className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeftIcon data-icon='inline-start' />
          All recipes
        </Link>
        <Link
          to='/recipes/$recipeId/edit'
          params={{ recipeId }}
          className={buttonVariants({ variant: 'outline' })}
        >
          Edit
        </Link>
      </div>
      {/* A recipe created here may have no image */}
      {recipe.image && (
        <img
          src={recipe.image}
          alt={recipe.name}
          width={320}
          height={320}
          className='size-80 rounded-md border object-cover'
        />
      )}
      <header className='flex flex-col gap-2'>
        <h1 className='font-medium'>{recipe.name}</h1>
        {recipe.tags.length > 0 && (
          <p className='text-sm text-muted-foreground'>{recipe.tags.join(' · ')}</p>
        )}
      </header>
      <dl className='grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4'>
        {facts.map(({ term, value }) => (
          <div key={term}>
            <dt className='text-muted-foreground'>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <section className='flex flex-col gap-2'>
        <h2 className='font-medium'>Ingredients</h2>
        {recipe.ingredients.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No ingredients listed.</p>
        ) : (
          <ul className='list-disc pl-5 text-sm'>
            {recipe.ingredients.map((ingredient, index) => (
              // oxlint-disable-next-line react/no-array-index-key -- the list never reorders, and two ingredients can read the same
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        )}
      </section>
      <section className='flex flex-col gap-2'>
        <h2 className='font-medium'>Instructions</h2>
        {recipe.instructions.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No instructions yet.</p>
        ) : (
          <ol className='list-decimal pl-5 text-sm'>
            {recipe.instructions.map((step, index) => (
              // oxlint-disable-next-line react/no-array-index-key -- the step number is its identity
              <li key={index}>{step}</li>
            ))}
          </ol>
        )}
      </section>
    </article>
  )
}
