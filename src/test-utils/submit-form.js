const sessionCookieOf = (response) =>
  [response.headers['set-cookie']]
    .flat()
    .filter(Boolean)
    .map((cookie) => cookie.split(';')[0])
    .join('; ')

export const submitForm = async ({ server, url, payload, auth, cookie }) => {
  const response = await server.inject({
    method: 'POST',
    url,
    payload,
    auth,
    headers: cookie ? { cookie } : {}
  })
  return { response, cookie: sessionCookieOf(response) || cookie }
}
