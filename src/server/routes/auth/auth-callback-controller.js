import { randomUUID } from 'node:crypto'

import Boom from '@hapi/boom'
import escapeHtml from 'lodash/escape.js'
import { saveUserSession } from '#/server/common/helpers/save-user-session.js'

export const authCallbackController = {
  handler: async (request, h) => {
    const credentials = await request.callback(h)
    request.logger.info(
      `Auth callback received credentials: ${Boolean(credentials)}`
    )

    if (!credentials) {
      throw Boom.unauthorized()
    }

    request.logger.info(
      `Auth callback ID token claims: ${JSON.stringify(redactPii(credentials.claims))}`
    )

    const accessTokenPayload = decodeJwtPayload(credentials.accessToken)
    request.logger.info(
      `Auth callback access token payload: ${JSON.stringify(redactPii(accessTokenPayload))}`
    )

    if (!accessTokenPayload?.roles?.includes('admin')) {
      const error = Boom.forbidden()
      error.data = {
        message: 'Contact Nature Restoration Fund digital team for access'
      }
      throw error
    }

    const { sessionCookie, yar, logger } = request

    const sessionId = randomUUID()

    logger.info(`Creating user session ${sessionId}`)
    const session = await saveUserSession(request, sessionId, credentials)

    sessionCookie.set({ sessionId })
    logger.info(
      `User logged in sessionId: ${sessionId} userId: ${session.id} displayName: ${session.displayName}`
    )

    const redirect = yar.flash('referrer')?.at(0) ?? '/'
    logger.info(`Login complete, redirecting user to ${redirect}`)
    return h
      .response(
        `<html><head><meta http-equiv="refresh" content="0;URL='${escapeHtml(redirect)}'"></head><body></body></html>`
      )
      .takeover()
  }
}

function decodeJwtPayload(jwt) {
  const payload = jwt?.split('.')[1]
  if (!payload) {
    return null
  }
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

const piiClaims = [
  'name',
  'given_name',
  'family_name',
  'email',
  'preferred_username',
  'upn',
  'unique_name',
  'ipaddr',
  'login_hint'
]

function redactPii(claims) {
  if (!claims) {
    return claims
  }
  const result = { ...claims }
  for (const claim of piiClaims) {
    if (claim in result) {
      result[claim] = '[redacted]'
    }
  }
  return result
}
