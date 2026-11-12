import { getSessionCookie } from './session-cookie.js'

export const submitForm = async ({ server, url, payload, auth, cookie }) => {
  const response = await server.inject({
    method: 'POST',
    url,
    payload,
    auth,
    headers: cookie ? { cookie } : {}
  })
  return { response, cookie: getSessionCookie(response) || cookie }
}
