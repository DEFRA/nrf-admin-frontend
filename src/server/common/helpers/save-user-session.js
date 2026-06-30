import { addSeconds } from 'date-fns'

/**
 * @typedef {object} UserSession
 * @property {string} id
 * @property {string} email
 * @property {string} displayName
 * @property {string} loginHint
 * @property {boolean} isAuthenticated
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number} expiresIn
 * @property {string} expiresAt
 */

/**
 * @typedef {Object} AuthenticationResponse
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number} expiresIn
 * @property {object} claims
 */

/**
 * @param {import("@hapi/hapi").Request} request
 * @param {string} sessionId
 * @param {AuthenticationResponse} authenticationResponse
 * @returns {Promise<UserSession>}
 */
export async function saveUserSession(
  request,
  sessionId,
  { accessToken, refreshToken, expiresIn, claims }
) {
  const expiresInSeconds = expiresIn
  const expiresInMilliSeconds = expiresInSeconds * 1000
  const expiresAt = addSeconds(new Date(), expiresInSeconds).toISOString()

  const session = {
    id: claims.oid,
    displayName: claims.name,
    email: claims.email ?? claims.preferred_username,
    loginHint: claims.login_hint,
    isAuthenticated: true,
    accessToken,
    refreshToken,
    expiresIn: expiresInMilliSeconds,
    expiresAt
  }

  await request.server.sessionCache.set(sessionId, session)
  return session
}
