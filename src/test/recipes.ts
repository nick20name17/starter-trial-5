import { http, HttpResponse } from 'msw'

import { testImage } from '@/test/image'

export function recipeSummary(id: number, name: string, overrides: object = {}) {
  return {
    id,
    name,
    image: testImage,
    rating: 4.5,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    tags: ['Pizza'],
    mealType: ['Dinner'],
    ...overrides,
  }
}

export const margherita = {
  ...recipeSummary(1, 'Classic Margherita Pizza', { tags: ['Pizza', 'Italian'] }),
  ingredients: ['Pizza dough', 'Tomato sauce'],
  instructions: ['Preheat the oven.', 'Bake for 15 minutes.'],
  servings: 4,
  difficulty: 'Easy',
  cuisine: 'Italian',
  caloriesPerServing: 300,
  reviewCount: 98,
}

export function margheritaHandler() {
  return http.get('*/recipes/1', () => HttpResponse.json(margherita))
}

export function recipeTagsHandler() {
  return http.get('*/recipes/tags', () => HttpResponse.json(['Pizza', 'Pasta']))
}
