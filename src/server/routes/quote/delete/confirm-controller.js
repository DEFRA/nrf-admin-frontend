import Boom from '@hapi/boom'

import { getQuote } from '../get-quote.js'
import { referenceParamSchema } from './schemas.js'

export const confirmDeleteController = {
  options: {
    validate: {
      params: referenceParamSchema
    }
  },
  async handler(request, h) {
    const { reference } = request.params
    const result = await getQuote(reference)

    if (result.quote === null) {
      throw Boom.notFound('Quote not found', {
        message: `No quote found with reference ${reference}`
      })
    }

    // Belt and braces with the quote page — hides the confirmation page from
    // direct URLs when the backend has flagged the quote as not deletable
    if (!result.quote.deleteEligible) {
      throw Boom.forbidden('Quote not eligible for deletion', {
        message: `Quote ${reference} was not created with an approved internal email address`
      })
    }

    return h.view('quote/delete/index', {
      pageTitle: `Delete quote ${reference}?`,
      heading: `Delete quote ${reference}?`,
      ...result
    })
  }
}
