import { getQuotes } from './get-quotes.js'

export const homeController = {
  async handler(_request, h) {
    const result = await getQuotes()
    return h.view('home/index', {
      pageTitle: 'Quotes',
      heading: 'Quotes',
      ...result
    })
  }
}
