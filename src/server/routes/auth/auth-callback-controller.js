import { randomUUID } from 'node:crypto'

import Boom from '@hapi/boom'
import escapeHtml from 'lodash/escape.js'
import { auditSignIn } from '#/server/common/helpers/auditing/index.js'
import { saveUserSession } from '#/server/common/helpers/save-user-session.js'

export const authCallbackController = {
  async handler(request, h) {
    const credentials = await request.callback(h)
    request.logger.info(
      { hasCredentials: Boolean(credentials) },
      'Auth callback received credentials'
    )

    if (!credentials) {
      throw Boom.unauthorized()
    }

    request.logger.info(
      { claims: redactPii(credentials.claims) },
      'Auth callback ID token claims'
    )

    const accessTokenPayload = decodeJwtPayload(credentials.accessToken)
    request.logger.info(
      { accessTokenPayload: redactPii(accessTokenPayload) },
      'Auth callback access token payload'
    )

    requireAdminRole(accessTokenPayload)

    const { sessionCookie, yar, logger } = request

    const sessionId = randomUUID()

    logger.info({ sessionId }, 'Creating user session')
    const session = await saveUserSession(request, sessionId, credentials)

    sessionCookie.set({ sessionId })
    logger.info(
      { sessionId, userId: session.id, displayName: session.displayName },
      'User logged in'
    )
    auditSignIn({ id: session.id, email: session.email })

    const redirect = yar.flash('referrer')?.at(0) ?? '/'
    logger.info({ redirect }, 'Login complete, redirecting user')
    return h
      .response(
        `<html><head><meta http-equiv="refresh" content="0;URL='${escapeHtml(redirect)}'"></head><body></body></html>`
      )
      .takeover()
  }
}

const ADMIN_ROLE = 'admin'
const ADMIN_ACCESS_MESSAGE =
  'Contact Nature Restoration Fund digital team for access'

function requireAdminRole(payload) {
  if (!Array.isArray(payload?.roles) || !payload.roles.includes(ADMIN_ROLE)) {
    throw Boom.forbidden(null, { message: ADMIN_ACCESS_MESSAGE })
  }
}

function decodeJwtPayload(jwt) {
  const payload = jwt?.split('.')[1]
  if (!payload) {
    return null
  }
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    throw Boom.unauthorized('Access token is not a valid JWT')
  }
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
