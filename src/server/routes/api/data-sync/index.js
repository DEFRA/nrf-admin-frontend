import {
  triggerQuerySchema,
  triggerBodySchema,
  rollbackBodySchema,
  runIdParamSchema
} from './schemas.js'
import { triggerHandler, rollbackHandler, statusHandler } from './controller.js'

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
            validate: { query: triggerQuerySchema, payload: triggerBodySchema }
          },
          handler: triggerHandler
        },
        {
          method: 'POST',
          path: '/api/data-sync/rollback',
          options: {
            auth: 'api-bearer',
            validate: { payload: rollbackBodySchema }
          },
          handler: rollbackHandler
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
