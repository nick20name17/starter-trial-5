import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod/mini'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/api'

import { DIFFICULTIES, MEAL_TYPES, type Recipe, type RecipeInput } from './recipes-queries'

function requiredText(message: string) {
  return z.string().check(z.trim(), z.minLength(1, message))
}

function lines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function minutes(message: string) {
  return z.int(message).check(z.nonnegative(message))
}

const recipeFormSchema = z.object({
  name: requiredText('Enter a name'),
  image: z.string().check(
    z.trim(),
    z.refine((image) => image === '' || URL.canParse(image), 'Enter a full URL, like https://…'),
  ),
  cuisine: requiredText('Enter a cuisine'),
  difficulty: z.enum(DIFFICULTIES, 'Pick a difficulty'),
  mealType: z.array(z.string()).check(z.minLength(1, 'Pick at least one meal')),
  tags: z.string(),
  prepTimeMinutes: minutes('Enter the prep time in whole minutes'),
  cookTimeMinutes: minutes('Enter the cook time in whole minutes'),
  servings: z.int('Enter the servings').check(z.positive('Enter at least 1 serving')),
  caloriesPerServing: z.int('Enter the calories').check(z.nonnegative('Enter the calories')),
  ingredients: z
    .string()
    .check(z.refine((text) => lines(text).length > 0, 'Add at least one ingredient')),
  instructions: z
    .string()
    .check(z.refine((text) => lines(text).length > 0, 'Add at least one step')),
})

type RecipeFormValues = z.input<typeof recipeFormSchema>

const emptyRecipe: RecipeFormValues = {
  name: '',
  image: '',
  cuisine: '',
  difficulty: 'Easy',
  mealType: [],
  tags: '',
  prepTimeMinutes: 0,
  cookTimeMinutes: 0,
  servings: 1,
  caloriesPerServing: 0,
  ingredients: '',
  instructions: '',
}

function toFormValues(recipe: Recipe): RecipeFormValues {
  return {
    ...recipe,
    difficulty: recipe.difficulty === 'unknown' ? 'Easy' : recipe.difficulty,
    tags: recipe.tags.join(', '),
    ingredients: recipe.ingredients.join('\n'),
    instructions: recipe.instructions.join('\n'),
  }
}

const difficultyItems = DIFFICULTIES.map((difficulty) => ({ value: difficulty, label: difficulty }))

interface RecipeFormProps {
  recipe?: Recipe
  submitLabel: string
  pending: boolean
  error: Error | null
  cancel: ReactNode
  onSubmit: (recipe: RecipeInput) => void
}

export function RecipeForm({
  recipe,
  submitLabel,
  pending,
  error,
  cancel,
  onSubmit,
}: RecipeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: recipe ? toFormValues(recipe) : emptyRecipe,
  })

  const submit = handleSubmit((values) => {
    onSubmit({
      ...values,
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      ingredients: lines(values.ingredients),
      instructions: lines(values.instructions),
    })
  })

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor='recipe-name'>Name</FieldLabel>
          <Input id='recipe-name' aria-invalid={!!errors.name} {...register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.image}>
          <FieldLabel htmlFor='recipe-image'>Image URL</FieldLabel>
          <Input
            id='recipe-image'
            type='url'
            aria-invalid={!!errors.image}
            {...register('image')}
          />
          <FieldDescription>Optional.</FieldDescription>
          <FieldError errors={[errors.image]} />
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field data-invalid={!!errors.cuisine}>
            <FieldLabel htmlFor='recipe-cuisine'>Cuisine</FieldLabel>
            <Input id='recipe-cuisine' aria-invalid={!!errors.cuisine} {...register('cuisine')} />
            <FieldError errors={[errors.cuisine]} />
          </Field>
          <Controller
            control={control}
            name='difficulty'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='recipe-difficulty'>Difficulty</FieldLabel>
                <Select
                  items={difficultyItems}
                  value={field.value}
                  onValueChange={(difficulty) => {
                    if (difficulty) field.onChange(difficulty)
                  }}
                >
                  <SelectTrigger
                    id='recipe-difficulty'
                    ref={field.ref}
                    aria-invalid={fieldState.invalid}
                    onBlur={field.onBlur}
                    className='w-full'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
        <Controller
          control={control}
          name='mealType'
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend variant='label'>Meal</FieldLegend>
              <div className='flex flex-wrap gap-x-6 gap-y-3'>
                {MEAL_TYPES.map((mealType, index) => {
                  const id = `recipe-meal-${mealType.replaceAll(' ', '-').toLowerCase()}`
                  return (
                    <Field key={mealType} orientation='horizontal' className='w-auto'>
                      <Checkbox
                        id={id}
                        // RHF focuses the first meal when none is picked
                        inputRef={index === 0 ? field.ref : undefined}
                        aria-invalid={fieldState.invalid}
                        checked={field.value.includes(mealType)}
                        onCheckedChange={(checked) =>
                          field.onChange(
                            checked
                              ? [...field.value, mealType]
                              : field.value.filter((value) => value !== mealType),
                          )
                        }
                      />
                      <FieldLabel htmlFor={id}>{mealType}</FieldLabel>
                    </Field>
                  )
                })}
              </div>
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
        <Field>
          <FieldLabel htmlFor='recipe-tags'>Tags</FieldLabel>
          <Input id='recipe-tags' {...register('tags')} />
          <FieldDescription>Separate tags with commas.</FieldDescription>
        </Field>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field data-invalid={!!errors.prepTimeMinutes}>
            <FieldLabel htmlFor='recipe-prep'>Prep time, minutes</FieldLabel>
            <Input
              id='recipe-prep'
              type='number'
              min={0}
              aria-invalid={!!errors.prepTimeMinutes}
              {...register('prepTimeMinutes', { valueAsNumber: true })}
            />
            <FieldError errors={[errors.prepTimeMinutes]} />
          </Field>
          <Field data-invalid={!!errors.cookTimeMinutes}>
            <FieldLabel htmlFor='recipe-cook'>Cook time, minutes</FieldLabel>
            <Input
              id='recipe-cook'
              type='number'
              min={0}
              aria-invalid={!!errors.cookTimeMinutes}
              {...register('cookTimeMinutes', { valueAsNumber: true })}
            />
            <FieldError errors={[errors.cookTimeMinutes]} />
          </Field>
          <Field data-invalid={!!errors.servings}>
            <FieldLabel htmlFor='recipe-servings'>Servings</FieldLabel>
            <Input
              id='recipe-servings'
              type='number'
              min={1}
              aria-invalid={!!errors.servings}
              {...register('servings', { valueAsNumber: true })}
            />
            <FieldError errors={[errors.servings]} />
          </Field>
          <Field data-invalid={!!errors.caloriesPerServing}>
            <FieldLabel htmlFor='recipe-calories'>Calories per serving</FieldLabel>
            <Input
              id='recipe-calories'
              type='number'
              min={0}
              aria-invalid={!!errors.caloriesPerServing}
              {...register('caloriesPerServing', { valueAsNumber: true })}
            />
            <FieldError errors={[errors.caloriesPerServing]} />
          </Field>
        </div>
        <Field data-invalid={!!errors.ingredients}>
          <FieldLabel htmlFor='recipe-ingredients'>Ingredients</FieldLabel>
          <Textarea
            id='recipe-ingredients'
            aria-invalid={!!errors.ingredients}
            {...register('ingredients')}
          />
          <FieldDescription>One per line.</FieldDescription>
          <FieldError errors={[errors.ingredients]} />
        </Field>
        <Field data-invalid={!!errors.instructions}>
          <FieldLabel htmlFor='recipe-instructions'>Instructions</FieldLabel>
          <Textarea
            id='recipe-instructions'
            aria-invalid={!!errors.instructions}
            {...register('instructions')}
          />
          <FieldDescription>One step per line.</FieldDescription>
          <FieldError errors={[errors.instructions]} />
        </Field>
        {error && <FieldError>{getErrorMessage(error)}</FieldError>}
        <Field orientation='horizontal'>
          <Button type='submit' pending={pending}>
            {submitLabel}
          </Button>
          {cancel}
        </Field>
      </FieldGroup>
    </form>
  )
}
