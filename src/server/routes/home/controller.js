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
    const { notification, reference, deletedCount, totalCount } = request.query
    return h.view('home/index', {
      pageTitle: 'Quotes',
      heading: 'Quotes',
      notification,
      deletedReference: reference,
      deletedCount,
      totalCount,
      ...result
    })
  }
}
