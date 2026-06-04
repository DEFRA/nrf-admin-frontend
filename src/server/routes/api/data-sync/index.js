import { triggerQuerySchema, runIdParamSchema } from './schemas.js'
import { triggerHandler, statusHandler } from './controller.js'

export const apiDataSync = {
  plugin: {
    name: 'api-data-sync',
    register(server) {
      server.route([
        {
          method: 'POST',
          path: '/api/data-sync',
          options: {
            auth: 'api-bearer',
            validate: { query: triggerQuerySchema }
          },
          handler: triggerHandler
        },
        {
          method: 'GET',
          path: '/api/data-sync/{runId}',
          options: {
            auth: 'api-bearer',
            validate: { params: runIdParamSchema }
          },
          handler: statusHandler
        }
      ])
    }
  }
}
