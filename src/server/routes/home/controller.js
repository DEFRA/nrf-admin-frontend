import { getQuotes } from './get-quotes.js'
import { homeQuerySchema } from './schemas.js'

export const homeController = {
  options: {
    validate: {
      query: homeQuerySchema
    }
  },
  async handler(request, h) {
    const result = await getQuotes()
    const { notification, count, reference, deletedCount, totalCount } =
      request.query
    return h.view('home/index', {
      pageTitle: 'Quotes',
      heading: 'Quotes',
      notification,
      clearedCount: count,
      deletedReference: reference,
      deletedCount,
      totalCount,
      ...result
    })
  }
}
