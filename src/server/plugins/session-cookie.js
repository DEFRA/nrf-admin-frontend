import authCookie from '@hapi/cookie'
import { config } from '#/config/config.js'
import { saveUserSession } from '#/server/common/helpers/save-user-session.js'

const sessionCookieConfig = config.get('session.cookie')

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
        redirectTo: '/sign-in',
        appendNext: true,
        keepAlive: true,
        requestDecoratorName: 'sessionCookie',
        validate: async (request, session) => {
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

          const userSession = !refreshedSession
            ? currentUserSession
            : refreshedSession

          return {
            isValid: true,
            credentials: userSession
          }
        }
      })

      server.auth.default({
        strategy: 'session',
        mode: 'required'
      })
    }
  }
}
