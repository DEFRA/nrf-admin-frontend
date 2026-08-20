import authCookie from '@hapi/cookie'
import { config } from '#/config/config.js'
import { saveUserSession } from '#/server/common/helpers/save-user-session.js'

const sessionCookieConfig = config.get('session.cookie')
const disableAuth = config.get('disableAuth')

const oneDayMs = 24 * 60 * 60 * 1000

const bypassSession = {
  id: 'local-dev',
  displayName: 'Local Dev User',
  email: 'local-dev@example.com',
  loginHint: '',
  isAuthenticated: true,
  accessToken: 'local-dev-token',
  refreshToken: 'local-dev-refresh',
  expiresIn: oneDayMs,
  expiresAt: new Date(Date.now() + oneDayMs).toISOString()
}

export const sessionCookie = {
  plugin: {
    name: 'user-session',
    register: async (server) => {
      await server.register(authCookie)
      server.auth.strategy('session', 'cookie', {
        cookie: {
          name: 'userSessionCookie',
          path: '/',
          password: sessionCookieConfig.password,
          isSecure: sessionCookieConfig.secure,
          ttl: sessionCookieConfig.ttl,
          clearInvalid: true
        },
        redirectTo: disableAuth ? false : '/sign-in',
        appendNext: !disableAuth,
        keepAlive: true,
        requestDecoratorName: 'sessionCookie',
        validate: async (request, session) => {
          if (disableAuth) {
            return { isValid: true, credentials: bypassSession }
          }

          const sessionId = session.sessionId
          if (!session?.sessionId) {
            return { isValid: false }
          }
          const currentUserSession = await server.sessionCache.get(sessionId)

          if (!currentUserSession?.isAuthenticated) {
            return { isValid: false }
          }

          let refreshedSession
          try {
            const { token, refreshed } =
              await request.ensureValidToken(currentUserSession)
            if (refreshed) {
              request.logger.info(`Refreshing session: ${sessionId}`)
              refreshedSession = await saveUserSession(
                request,
                sessionId,
                token
              )
            }
          } catch (error) {
            request.logger.debug(
              error,
              `Token refresh for ${currentUserSession?.displayName} failed`
            )
            server.sessionCache.drop(sessionId)
            if (request.sessionCookie?.h) {
              request.sessionCookie.clear()
              request.sessionCookie.h.unstate('userSessionCookie')
            }
            request.yar.flash('globalValidationFailures', 'Your login expired')
          }

          const userSession = refreshedSession || currentUserSession

          return {
            isValid: true,
            credentials: userSession
          }
        }
      })

      if (disableAuth) {
        // Inject bypass credentials on every request so routes requiring auth pass
        server.ext('onPreAuth', (_request, h) => {
          _request.auth.credentials = bypassSession
          _request.auth.isAuthenticated = true
          _request.auth.strategy = 'session'
          return h.continue
        })
        server.auth.default({ strategy: 'session', mode: 'optional' })
      } else {
        server.auth.default({ strategy: 'session', mode: 'required' })
      }
    }
  }
}
