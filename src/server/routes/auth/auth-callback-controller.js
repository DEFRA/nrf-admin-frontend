import { randomUUID } from 'node:crypto'

import Boom from '@hapi/boom'
import escapeHtml from 'lodash/escape.js'
import { config } from '#/config/config.js'
import { auditSignIn } from '#/server/common/helpers/auditing/index.js'
import { saveUserSession } from '#/server/common/helpers/save-user-session.js'

export const authCallbackController = {
  async handler(request, h) {
    const credentials = await request.callback(h)
    if (!credentials) {
      throw Boom.unauthorized()
    }
    const accessTokenPayload = decodeJwtPayload(credentials.accessToken)
    requireAdminAccess(accessTokenPayload)

    const { sessionCookie, yar, logger } = request

    const sessionId = randomUUID()

    logger.info({ sessionId }, 'Creating user session')
    const session = await saveUserSession(request, sessionId, credentials)

    sessionCookie.set({ sessionId })

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

const ADMIN_ACCESS_MESSAGE =
  'Contact Nature Restoration Fund digital team for access'
function requireAdminAccess(payload) {
  const isWhitelisted = config
    .get('auth.teamAdminEmails')
    .some((email) => email.toLowerCase().trim() === payload.upn.toLowerCase())
  if (!isWhitelisted) {
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
