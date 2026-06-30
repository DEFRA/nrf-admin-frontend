import { config } from '#/config/config.js'

export const signOutController = {
  handler: async (request, h) => {
    const userSession = request.auth.credentials

    if (!userSession) {
      return h.redirect('/')
    }

    const { discoveryUri, externalBaseUrl } = config.get('auth.oidc')
    const loginHint = userSession?.loginHint

    // Clear the local session before contacting the IdP so sign-out cannot
    // fail open if discovery is unreachable or returns invalid JSON.
    request.server.sessionCache.drop(request.state.userSessionCookie.sessionId)
    if (request.sessionCookie?.h) {
      request.sessionCookie.clear()
      request.sessionCookie.h.unstate('userSessionCookie')
    }

    try {
      const res = await fetch(discoveryUri)
      const payload = await res.json()

      const logoutUrl = encodeURI(
        `${payload.end_session_endpoint}?logout_hint=${loginHint}&post_logout_redirect_uri=${externalBaseUrl}`
      )

      return h.redirect(logoutUrl)
    } catch {
      return h.redirect('/')
    }
  }
}
