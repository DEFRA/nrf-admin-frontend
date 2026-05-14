import path from 'path'
import hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'

import { router } from './plugins/router.js'
import { config } from '#/config/config.js'
import { pulse } from './plugins/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { nunjucksConfig } from '#/config/nunjucks/nunjucks.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { requestTracing } from './plugins/request-tracing.js'
import { requestLogger } from './plugins/request-logger.js'
import { sessionCache } from './plugins/session-cache.js'
import { getCacheEngine } from './common/helpers/session-cache/cache-engine.js'
import { secureContext } from '@defra/hapi-secure-context'
import { contentSecurityPolicy } from './plugins/content-security-policy.js'
import { metrics } from '@defra/cdp-metrics'
import { federatedOidc } from './plugins/federated-oidc.js'
import { cognitoFederatedCredentials } from './plugins/cognito.js'
import { sessionCookie } from './common/helpers/auth/session-cookie.js'
import { getUserSession } from './common/helpers/auth/get-user-session.js'
import { dropUserSession } from './common/helpers/auth/drop-user-session.js'
import { audit } from '@defra/cdp-auditing'

export async function createServer() {
  setupProxy()
  const server = hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      // TODO - enable this when entra ID auth set up
      // auth: {
      //   mode: 'try'
      // },
      auth: false,
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(config.get('session.cache.engine'))
      }
    ],
    state: {
      strictHeader: false
    }
  })
  server.decorate('request', 'getUserSession', getUserSession)
  server.decorate('request', 'dropUserSession', dropUserSession)
  server.decorate('request', 'audit', {
    sendMessage: (...args) => audit(...args)
  })

  const credentialProvider = cognitoFederatedCredentials
  await server.register([
    requestLogger,
    requestTracing,
    metrics,
    secureContext,
    pulse,
    sessionCache,
    credentialProvider,
    federatedOidc,
    sessionCookie,
    nunjucksConfig,
    Scooter,
    contentSecurityPolicy,
    router // Register all the controllers/routes defined in src/server/router.js
  ])

  server.ext('onPreResponse', catchAll)

  return server
}
