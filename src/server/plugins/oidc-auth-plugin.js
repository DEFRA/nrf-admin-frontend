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

const authProvider = federatedCredentials.enableMocking
  ? new MockProvider({})
  : new CognitoTokenProvider({
      poolId: federatedCredentials.identityPoolId,
      logins: { 'cdp-portal-frontend-aad-access': 'cdp-portal-frontend' }
    })

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
