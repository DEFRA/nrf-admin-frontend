import { JSDOM } from 'jsdom'

export const authenticatedRequest = {
  strategy: 'session',
  credentials: { isAuthenticated: true, displayName: 'Test User' }
}

export const loadPage = async ({ requestUrl, server, cookie, auth }) => {
  const response = await server.inject({
    method: 'GET',
    url: requestUrl,
    headers: cookie ? { cookie } : {},
    ...(auth ? { auth } : {})
  })
  const { window } = new JSDOM(response.result)
  return window.document
}
