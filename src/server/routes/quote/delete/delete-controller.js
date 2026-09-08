import joi from 'joi'

import { statusCodes } from '#/server/common/constants/status-codes.js'
import { deleteQuote } from './delete-quote.js'
import { referenceParamSchema } from './schemas.js'

export const deleteQuoteController = {
  options: {
    validate: {
      params: referenceParamSchema,
      payload: joi.object({})
    }
  },
  async handler(request, h) {
    const { reference } = request.params
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
