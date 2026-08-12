import { getRequestFromBackend } from '#/server/common/services/nrf-backend.js'
import { createLogger } from '#/server/common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * Map a GOV.UK Notify delivery status to a GOV.UK tag ({ text, classes }) for
 * the quotes table. Unknown/null statuses render as a neutral "Pending" tag.
 */
const emailStatusTag = (status) => {
  switch (status) {
    case 'delivered':
      return { text: 'Delivered', classes: 'govuk-tag--green' }
    case 'permanent-failure':
    case 'technical-failure':
      return { text: 'Failed', classes: 'govuk-tag--red' }
    case 'temporary-failure':
      return { text: 'Temporary failure', classes: 'govuk-tag--yellow' }
    case 'created':
    case 'sending':
      return { text: 'Sending', classes: 'govuk-tag--blue' }
    default:
      return { text: 'Pending', classes: 'govuk-tag--grey' }
  }
}

const transformQuotes = (quotes) =>
  quotes.map((quote) => ({
    ...quote,
    boundary: {
      userInputType: quote.boundary.userInputType,
      filename: quote.boundary.filename
    },
    email: {
      ...quote.email,
      statusTag: emailStatusTag(quote.email?.status)
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
