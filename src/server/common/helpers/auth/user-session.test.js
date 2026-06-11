import {
  describe,
  test,
  expect,
  vi,
  beforeAll,
  afterAll,
  beforeEach
} from 'vitest'
import jwt from '@hapi/jwt'

import {
  createUserSession,
  refreshUserSession,
  removeAuthenticatedUser
} from './user-session.js'

vi.mock('@hapi/jwt')

const USER_EMAIL = 'user@example.com'
const SESSION_ID = 'session-id'

beforeAll(() => {
  vi.useFakeTimers({ advanceTimers: true })
  vi.setSystemTime(new Date('2025-02-28'))
})

afterAll(() => {
  vi.useRealTimers()
})

describe('#createUserSession', () => {
  const request = {
    auth: {
      credentials: {
        expiresIn: 3600,
        claims: {
          oid: 'user-id',
          name: 'User Name',
          email: USER_EMAIL,
          login_hint: USER_EMAIL
        },
        token: 'access-token',
        refreshToken: 'refresh-token'
      },
      isAuthenticated: true
    },
    server: {
      session: {
        set: vi.fn()
      }
    }
  }
  const sessionId = SESSION_ID

  test('Should create a user session with correct details', async () => {
    await createUserSession(request, sessionId)

    expect(request.server.session.set).toHaveBeenCalledWith(sessionId, {
      id: 'user-id',
      email: USER_EMAIL,
      displayName: 'User Name',
      loginHint: USER_EMAIL,
      isAuthenticated: true,
      token: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600000,
      expiresAt: expect.any(String)
    })
  })
})

describe('#refreshUserSession', () => {
  const request = {
    logger: {
      debug: vi.fn(),
      info: vi.fn()
    },
    state: { userSessionCookie: { sessionId: SESSION_ID } },
    server: { session: { set: vi.fn() } },
    getUserSession: vi.fn()
  }
  const refreshTokenResponse = {
    access_token: 'new-access-token',
    expires_in: 3600,
    refresh_token: 'new-refresh-token'
  }

  beforeEach(async () => {
    jwt.token.decode.mockReturnValue({
      decoded: {
        payload: {
          oid: 'user-id',
          preferred_username: USER_EMAIL,
          name: 'User Name',
          login_hint: USER_EMAIL
        }
      }
    })

    await refreshUserSession(request, refreshTokenResponse)
  })

  test('Should refresh the user session with new token and expiry details', () => {
    expect(request.server.session.set).toHaveBeenCalledWith(SESSION_ID, {
      id: 'user-id',
      email: USER_EMAIL,
      displayName: 'User Name',
      loginHint: USER_EMAIL,
      isAuthenticated: true,
      token: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600000,
      expiresAt: expect.any(String)
    })
  })

  test('Should log the user session refresh', () => {
    expect(request.logger.info).toHaveBeenCalledWith(
      'User session refreshed, UserId: user-id, displayName: User Name'
    )
  })
})

describe('#removeAuthenticatedUser', () => {
  test('Should remove the authenticated user from the portal', () => {
    const request = {
      dropUserSession: vi.fn(),
      sessionCookie: {
        clear: vi.fn(),
        h: {
          response: vi.fn().mockReturnThis(),
          unstate: vi.fn().mockReturnThis()
        }
      }
    }

    removeAuthenticatedUser(request)

    expect(request.dropUserSession).toHaveBeenCalled()
    expect(request.sessionCookie.clear).toHaveBeenCalled()
  })
})
