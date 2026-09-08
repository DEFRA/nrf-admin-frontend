import { getQuotes } from './get-quotes.js'

export const homeController = {
  async handler(request, h) {
    const result = await getQuotes()
    const { notification, count, reference } = request.query
    return h.view('home/index', {
      pageTitle: 'Quotes',
      heading: 'Quotes',
      notification,
      clearedCount: count,
      deletedReference: reference,
      ...result
    })
  }
}
