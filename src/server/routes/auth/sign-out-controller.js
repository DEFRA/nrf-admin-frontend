import { config } from '#/config/config.js'

export const signOutController = {
  handler: async (request, h) => {
    const userSession = request.auth.credentials

    if (!userSession) {
      return h.redirect('/')
    }

    const { discoveryUri, externalBaseUrl } = config.get('auth.oidc')

    const res = await fetch(discoveryUri)
    const payload = await res.json()

    const logoutBaseUrl = payload.end_session_endpoint
    const loginHint = userSession?.loginHint

    const logoutUrl = encodeURI(
      `${logoutBaseUrl}?logout_hint=${loginHint}&post_logout_redirect_uri=${externalBaseUrl}`
    )

    request.server.sessionCache.drop(request.state.userSessionCookie.sessionId)
    if (request.sessionCookie?.h) {
      request.sessionCookie.clear()
      request.sessionCookie.h.unstate('userSessionCookie')
    }

    return h.redirect(logoutUrl)
  }
}
