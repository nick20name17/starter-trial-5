import { http, HttpResponse } from 'msw'

// A data: URL skips the service worker, so the page loads no image from the network
export const thumbnail =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export const lashMascara = {
  id: 1,
  title: 'Lash Mascara',
  price: 9.99,
  thumbnail,
  description: 'Volumizing mascara.',
}

export function lashMascaraHandler() {
  return http.get('*/products/1', () => HttpResponse.json(lashMascara))
}
