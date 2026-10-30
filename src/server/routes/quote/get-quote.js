import { getRequestFromBackend } from '#/server/common/services/nrf-backend.js'
import { createLogger } from '#/server/common/helpers/logging/logger.js'
import { emailStatusTag } from '#/server/common/helpers/email-status-tag.js'
import { canDeleteQuote } from '#/server/common/helpers/can-delete-quote.js'
import { config } from '#/config/config.js'

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
    const found = payload.find((item) => item.reference === reference) ?? null
    const quote = found
      ? {
          ...found,
          emailNotifications: (found.emailNotifications ?? []).map((n) => ({
            ...n,
            statusTag: emailStatusTag(
              n.notifySendStatus,
              n.emailType,
              n.notificationId ?? null
            )
          })),
          // The backend no longer gates deletion (NRF2-1343 opened the
          // endpoint to the request-to-use journey) — eligibility is decided
          // here instead
          deleteEligible: canDeleteQuote({
            email: found.email?.address,
            patterns: config.get('quoteDelete.eligibleEmailPatterns'),
            isProd: config.get('isProduction')
          })
        }
      : null
    return { quote }
  } catch (error) {
    logger.error(error, 'Failed to fetch quotes from backend')
    return { errorMessage: 'An error occurred getting the quote' }
  }
}
