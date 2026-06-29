import { config } from '#/config/config.js'
import {
  CognitoTokenProvider,
  hapiAuthOidcPlugin,
  MockProvider
} from '@defra/hapi-auth-oidc'

const { oidc, cookieOptions, federatedCredentials } = config.get('auth')

const scope = [
  `api://${oidc.clientId}/default`,
  'openid',
  'profile',
  'email',
  'offline_access',
  'user.read'
].join(' ')

const cognitoProvider = federatedCredentials.enableMocking
  ? new MockProvider({})
  : new CognitoTokenProvider({
      poolId: federatedCredentials.identityPoolId,
      logins: { 'cdp-portal-frontend-aad-access': 'cdp-portal-frontend' }
    })

// The provider swallows the underlying AWS error and logs it with the pino
// args reversed, so the real cause never reaches the logs. Wrap getCredentials
// to surface the actual error (correct pino order: error first, message second)
// and to fail loudly instead of silently returning a null assertion.
const authProvider = {
  type: cognitoProvider.type,
  getCredentials: async (logger) => {
    const token = await cognitoProvider.getCredentials(logger)
    if (!token) {
      const error = new Error(
        'Federated credential provider returned no token; client assertion would be empty'
      )
      logger?.error?.(error, '[oidc] failed to obtain federated credential')
      throw error
    }
    return token
  }
}

export const authOidcPlugin = {
  plugin: hapiAuthOidcPlugin,
  options: {
    oidc: {
      ...oidc,
      scope,
      authProvider
    },
    // Entra returns to /auth/callback via a cross-site form_post, so the state
    // cookie holding the PKCE verifier must be SameSite=None; Secure or the
    // browser withholds it on the POST and the callback fails with 401.
    cookieOptions: {
      ...cookieOptions,
      isSameSite: 'None',
      isSecure: true
    }
  }
}
