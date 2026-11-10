import crumb from '@hapi/crumb'

import { config } from '#/config/config.js'

// @hapi/crumb still runs generate() on routes that opt out via
// plugins.crumb: false (autoGenerate applies regardless), and since those
// routes never read the existing cookie into request.plugins.crumb, it
// looks unset and a brand new crumb is minted, silently invalidating the
// real cookie the client is still holding. Using skip() bypasses crumb's
// cookie read/generate logic entirely for these routes. They are not browser
// forms: bearer-token APIs, and the OIDC callback posted by the identity provider.
const NO_CRUMB_PATHS = ['/auth/callback']
const NO_CRUMB_PATH_PREFIXES = ['/api/', '/upload-and-scan/']

export const csrf = {
  plugin: crumb,
  options: {
    key: 'csrfToken',
    size: 43,
    cookieOptions: {
      isSecure: config.get('isProduction'),
      // Hapi defaults to Strict, which drops the cookie on navigations from
      // another site, so each open mints a new token and invalidates the form
      // in any earlier tab. Lax still withholds it from cross-site POSTs.
      isSameSite: 'Lax'
    },
    skip: (request) =>
      config.get('isTest') ||
      NO_CRUMB_PATHS.includes(request.path) ||
      NO_CRUMB_PATH_PREFIXES.some((prefix) => request.path.startsWith(prefix))
  }
}
