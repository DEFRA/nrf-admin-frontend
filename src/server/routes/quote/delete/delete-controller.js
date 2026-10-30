import Joi from 'joi'

import { statusCodes } from '#/server/common/constants/status-codes.js'
import { deleteQuote } from './delete-quote.js'
import { getQuote } from '../get-quote.js'
import { referenceParamSchema } from './schemas.js'

export const deleteQuoteController = {
  options: {
    validate: {
      params: referenceParamSchema,
      payload: Joi.object({})
    }
  },
  async handler(request, h) {
    const { reference } = request.params

    // Eligibility is this app's check now the backend no longer gates the
    // endpoint — verify before deleting, so a direct POST cannot bypass the
    // confirmation page's guard. A quote we cannot fetch fails safe.
    const fetched = await getQuote(reference)
    if (fetched.errorMessage) {
      return h
        .redirect('/?notification=quote-delete-error')
        .code(statusCodes.redirectAfterPost)
    }
    if (fetched.quote === null || !fetched.quote.deleteEligible) {
      return h
        .redirect('/?notification=quote-delete-not-eligible')
        .code(statusCodes.redirectAfterPost)
    }

    const result = await deleteQuote(reference)

    if (result.statusCode === statusCodes.forbidden) {
      return h
        .redirect('/?notification=quote-delete-not-eligible')
        .code(statusCodes.redirectAfterPost)
    }

    if (result.errorMessage) {
      return h
        .redirect('/?notification=quote-delete-error')
        .code(statusCodes.redirectAfterPost)
    }

    return h
      .redirect(`/?notification=quote-deleted&reference=${reference}`)
      .code(statusCodes.redirectAfterPost)
  }
}
