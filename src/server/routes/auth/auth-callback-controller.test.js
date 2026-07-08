import { vi } from 'vitest'
import Boom from '@hapi/boom'

import { authCallbackController } from './auth-callback-controller.js'
import {
  accessToken,
  accessTokenWithRole
} from '#/test-utils/fixtures/token.js'

vi.mock('#/config/config.js', () => ({
  config: {
    get: (k) =>
      ({
        'auth.teamAdminEmails': ['allowed@defra.onmicrosoft.com']
      })[k]
  }
}))

vi.mock('#/server/common/helpers/save-user-session.js', () => ({
  saveUserSession: vi
    .fn()
    .mockResolvedValue({ id: 'user-1', displayName: 'Test User' })
}))

function encodeJwt(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `header.${encoded}.signature`
}

function buildRequest(credentials) {
  return {
    callback: vi.fn().mockResolvedValue(credentials),
    logger: { info: vi.fn(), error: vi.fn() },
    sessionCookie: { set: vi.fn() },
    yar: { flash: vi.fn().mockReturnValue([]) },
    server: { sessionCache: { set: vi.fn() } }
  }
}

const mockH = {
  response: vi.fn().mockReturnThis(),
  takeover: vi.fn().mockReturnThis()
}

describe('authCallbackController', () => {
  it('throws Boom.unauthorized when credentials are null', async () => {
    const request = buildRequest(null)

    await expect(
      authCallbackController.handler(request, mockH)
    ).rejects.toThrow(Boom.unauthorized().message)
  })

  it('throws Boom.unauthorized when access token is not a valid JWT', async () => {
    const request = buildRequest({
      accessToken: 'not.valid.jwt.payload',
      refreshToken: 'refresh',
      expiresIn: 3600,
      claims: { oid: 'oid-1', name: 'Test User' }
    })

    await expect(
      authCallbackController.handler(request, mockH)
    ).rejects.toMatchObject({
      isBoom: true,
      output: { statusCode: 401 }
    })
  })

  it('throws Boom.forbidden with custom message when access token has no roles', async () => {
    const request = buildRequest({
      accessToken: encodeJwt(accessToken),
      refreshToken: 'refresh',
      expiresIn: 3600,
      claims: { oid: 'oid-1', name: 'Test User' }
    })

    await expect(
      authCallbackController.handler(request, mockH)
    ).rejects.toMatchObject({
      isBoom: true,
      output: { statusCode: 403 },
      data: {
        message: 'Contact Nature Restoration Fund digital team for access'
      }
    })
  })

  it('throws Boom.forbidden when roles is a string rather than an array', async () => {
    const request = buildRequest({
      accessToken: encodeJwt({ ...accessToken, roles: 'admin' }),
      refreshToken: 'refresh',
      expiresIn: 3600,
      claims: { oid: 'oid-1', name: 'Test User' }
    })

    await expect(
      authCallbackController.handler(request, mockH)
    ).rejects.toMatchObject({
      isBoom: true,
      output: { statusCode: 403 }
    })
  })

  it('throws Boom.forbidden with custom message when roles does not include admin', async () => {
    const request = buildRequest({
      accessToken: encodeJwt({ ...accessToken, roles: ['viewer'] }),
      refreshToken: 'refresh',
      expiresIn: 3600,
      claims: { oid: 'oid-1', name: 'Test User' }
    })

    await expect(
      authCallbackController.handler(request, mockH)
    ).rejects.toMatchObject({
      isBoom: true,
      output: { statusCode: 403 },
      data: {
        message: 'Contact Nature Restoration Fund digital team for access'
      }
    })
  })

  it('completes login when access token includes admin role', async () => {
    const request = buildRequest({
      accessToken: encodeJwt(accessTokenWithRole),
      refreshToken: 'refresh',
      expiresIn: 3600,
      claims: { oid: 'oid-1', name: 'Test User' }
    })

    await expect(
      authCallbackController.handler(request, mockH)
    ).resolves.not.toThrow()

    expect(request.sessionCookie.set).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: expect.any(String) })
    )
  })

  it('completes login when email is in the team admin whitelist', async () => {
    const request = buildRequest({
      accessToken: encodeJwt(accessToken),
      refreshToken: 'refresh',
      expiresIn: 3600,
      claims: {
        oid: 'oid-2',
        name: 'Allowed User',
        email: 'allowed@defra.onmicrosoft.com'
      }
    })

    await expect(
      authCallbackController.handler(request, mockH)
    ).resolves.not.toThrow()

    expect(request.sessionCookie.set).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: expect.any(String) })
    )
  })

  it('throws Boom.forbidden when no admin role and email is not whitelisted', async () => {
    const request = buildRequest({
      accessToken: encodeJwt(accessToken),
      refreshToken: 'refresh',
      expiresIn: 3600,
      claims: {
        oid: 'oid-3',
        name: 'Unknown User',
        email: 'unknown@example.com'
      }
    })

    await expect(
      authCallbackController.handler(request, mockH)
    ).rejects.toMatchObject({
      isBoom: true,
      output: { statusCode: 403 },
      data: {
        message: 'Contact Nature Restoration Fund digital team for access'
      }
    })
  })
})
