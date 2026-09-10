import { deleteRequestFromBackend } from '#/server/common/services/nrf-backend.js'
import { createLogger } from '#/server/common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * @param {string} reference - NRL reference, e.g. NRL-000001
 * @returns {Promise<{ deleted: boolean } | { errorMessage: string, statusCode: number }>}
 */
export async function deleteQuote(reference) {
  try {
    await deleteRequestFromBackend({ endpointPath: `/quotes/${reference}` })
    return { deleted: true }
  } catch (error) {
    logger.error(error, 'Failed to delete quote in backend')
    return {
      errorMessage: 'An error occurred deleting the quote',
      statusCode: error.output?.statusCode
    }
  }
}
