import { JSDOM } from 'jsdom'

import { getSessionCookie } from './session-cookie.js'

export const authenticatedRequest = {
  strategy: 'session',
  credentials: { isAuthenticated: true, displayName: 'Test User' }
}

/**
 * Loads a page and also returns the session cookie to send on the next request,
 * for tests of state that is read once, like flashed form errors.
 */
export const loadPageWithCookie = async ({
  requestUrl,
  server,
  cookie,
  auth
}) => {
  const response = await server.inject({
    method: 'GET',
    url: requestUrl,
    headers: cookie ? { cookie } : {},
    ...(auth ? { auth } : {})
  })
  const { window } = new JSDOM(response.result)
  return {
    document: window.document,
    cookie: getSessionCookie(response) || cookie
  }
}

export const loadPage = async (params) =>
  (await loadPageWithCookie(params)).document
