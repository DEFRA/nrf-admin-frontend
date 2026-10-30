import { getRequestFromBackend } from '#/server/common/services/nrf-backend.js'
import { createLogger } from '#/server/common/helpers/logging/logger.js'
import { emailStatusTag } from '#/server/common/helpers/email-status-tag.js'
import { canDeleteQuote } from '#/server/common/helpers/can-delete-quote.js'
import { config } from '#/config/config.js'

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
    },
    // The backend no longer gates deletion (NRF2-1343 opened the endpoint to
    // the request-to-use journey) — eligibility is decided here instead
    deleteEligible: canDeleteQuote({
      email: quote.email?.address,
      patterns: config.get('quoteDelete.eligibleEmailPatterns'),
      isProd: config.get('isProduction')
    })
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
