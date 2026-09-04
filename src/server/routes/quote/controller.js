import Boom from '@hapi/boom'

import { getQuote } from './get-quote.js'

export const quoteController = {
  async handler(request, h) {
    const { reference } = request.params
    const result = await getQuote(reference)

    if (result.quote === null) {
      throw Boom.notFound('Quote not found', {
        message: `No quote found with reference ${reference}`
      })
    }

    return h.view('quote/index', {
      pageTitle: `Quote ${reference}`,
      heading: `Quote ${reference}`,
      ...result
    })
  }
}
