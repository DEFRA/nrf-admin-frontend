import Boom from '@hapi/boom'

import { getQuotes } from '../../home/get-quotes.js'
import { referencesQuerySchema } from './schemas.js'

export const bulkDeleteConfirmController = {
  options: {
    validate: {
      query: referencesQuerySchema
    }
  },
  async handler(request, h) {
    const references = new Set(request.query.references ?? [])
    const result = await getQuotes()

    if (result.errorMessage) {
      throw Boom.badGateway('Could not load quotes from the backend', {
        message: result.errorMessage
      })
    }

    // Only eligible quotes can be deleted — drop anything the client sent
    // that is unknown or no longer eligible
    const selectedQuotes = (result.quotes ?? []).filter(
      (quote) => references.has(quote.reference) && quote.deleteEligible
    )

    if (selectedQuotes.length === 0) {
      return h.redirect('/?notification=quotes-bulk-none-selected')
    }

    const quotePlural = selectedQuotes.length === 1 ? 'quote' : 'quotes'
    return h.view('quotes/bulk-delete/index', {
      pageTitle: `Delete ${selectedQuotes.length} ${quotePlural}?`,
      heading: `Delete ${selectedQuotes.length} ${quotePlural}?`,
      quotes: selectedQuotes
    })
  }
}
