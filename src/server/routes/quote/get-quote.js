import { getRequestFromBackend } from '#/server/common/services/nrf-backend.js'
import { createLogger } from '#/server/common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * The admin app reads quotes from the list endpoint — the per-quote endpoint
 * requires a Bearer token the admin session doesn't hold.
 *
 * @param {string} reference - NRL reference, e.g. NRL-000001
 * @returns {Promise<{ quote: object | null } | { errorMessage: string }>}
 */
export async function getQuote(reference) {
  try {
    const { payload } = await getRequestFromBackend({ endpointPath: '/quotes' })
    const quote = payload.find((item) => item.reference === reference) ?? null
    return { quote }
  } catch (error) {
    logger.error(error, 'Failed to fetch quotes from backend')
    return { errorMessage: 'An error occurred getting the quote' }
  }
}
