import { getRequestFromBackend } from '#src/server/common/services/nrf-backend.js'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * @returns {Promise<{ quotes: object[] } | { errorMessage: string }>}
 */
export async function getQuotes() {
  try {
    const { payload } = await getRequestFromBackend({ endpointPath: '/quotes' })
    return { quotes: payload }
  } catch (error) {
    logger.error(error, 'Failed to fetch quotes from backend')
    return { errorMessage: 'An error occurred getting quotes' }
  }
}
