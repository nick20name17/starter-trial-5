import { http, HttpResponse } from 'msw'

import { testImage } from '@/test/image'

export const lashMascara = {
  id: 1,
  title: 'Lash Mascara',
  price: 9.99,
  thumbnail: testImage,
  description: 'Volumizing mascara.',
}

export function lashMascaraHandler() {
  return http.get('*/products/1', () => HttpResponse.json(lashMascara))
}
