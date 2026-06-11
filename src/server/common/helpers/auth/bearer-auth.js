import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import authBearer from 'hapi-auth-bearer-token'

import { config } from '#/config/config.js'

function safeEqual(a, b) {
  const ab = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export const bearerAuth = {
  plugin: {
    name: 'bearer-auth',
    async register(server) {
      await server.register(authBearer)
      server.auth.strategy('api-bearer', 'bearer-access-token', {
        allowQueryToken: false,
        allowMultipleHeaders: false,
        validate: async (_request, token) => {
          const expected = config.get('api.bearerToken')
          if (!expected) {
            return { isValid: false, credentials: {} }
          }
          const isValid = safeEqual(token, expected)
          return { isValid, credentials: { client: 'api' } }
        }
      })
    }
  }
}
