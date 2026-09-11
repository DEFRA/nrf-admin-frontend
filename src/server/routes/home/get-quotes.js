import { getRequestFromBackend } from '#/server/common/services/nrf-backend.js'
import { createLogger } from '#/server/common/helpers/logging/logger.js'
import { emailStatusTag } from '#/server/common/helpers/email-status-tag.js'

const logger = createLogger()

const transformQuotes = (quotes) =>
  quotes.map((quote) => ({
    ...quote,
    boundary: {
      userInputType: quote.boundary.userInputType,
      filename: quote.boundary.filename
    },
    email: {
      ...quote.email,
      statusTag: emailStatusTag(
        quote.email?.notifySendStatus,
        quote.email?.emailType
      )
    }
  }))

/**
 * @returns {Promise<{ quotes: object[] } | { errorMessage: string }>}
 */
export async function getQuotes() {
  try {
    const { payload } = await getRequestFromBackend({ endpointPath: '/quotes' })
    return { quotes: transformQuotes(payload) }
  } catch (error) {
    logger.error(error, 'Failed to fetch quotes from backend')
    return { errorMessage: 'An error occurred getting quotes' }
  }
}
