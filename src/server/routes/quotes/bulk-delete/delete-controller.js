import { statusCodes } from '#/server/common/constants/status-codes.js'
import { deleteQuotes } from './bulk-delete-quote.js'
import { referencesPayloadSchema } from './schemas.js'

export const bulkDeleteController = {
  options: {
    validate: {
      payload: referencesPayloadSchema
    }
  },
  async handler(request, h) {
    const references = request.payload.references
    const { deleted, failed, notEligible } = await deleteQuotes(references)

    if (deleted === 0) {
      // Every failure being a 403 means the backend's eligibility check — not
      // a server fault — refused the quotes, so show the eligibility banner
      const notification =
        notEligible === failed
          ? 'quotes-delete-not-eligible'
          : 'quotes-delete-failed'

      return h
        .redirect(`/?notification=${notification}`)
        .code(statusCodes.redirectAfterPost)
    }

    if (failed > 0) {
      return h
        .redirect(
          `/?notification=quotes-delete-partial&deletedCount=${deleted}&totalCount=${references.length}`
        )
        .code(statusCodes.redirectAfterPost)
    }

    return h
      .redirect(
        `/?notification=quotes-deleted&deletedCount=${references.length}`
      )
      .code(statusCodes.redirectAfterPost)
  }
}
