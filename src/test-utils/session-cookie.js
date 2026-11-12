export const getSessionCookie = (response) =>
  [response.headers['set-cookie']]
    .flat()
    .filter(Boolean)
    .map((cookie) => cookie.split(';')[0])
    .join('; ')
