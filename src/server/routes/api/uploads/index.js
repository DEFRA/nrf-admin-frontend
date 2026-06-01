import { initiateBodySchema, uploadIdParamSchema } from './schemas.js'
import { initiateHandler, statusHandler, detailsHandler } from './controller.js'

export const apiUploads = {
  plugin: {
    name: 'api-uploads',
    register(server) {
      server.route([
        {
          method: 'POST',
          path: '/api/uploads/initiate',
          options: {
            auth: 'api-bearer',
            validate: { payload: initiateBodySchema }
          },
          handler: initiateHandler
        },
        {
          method: 'GET',
          path: '/api/uploads/{uploadId}/status',
          options: {
            auth: 'api-bearer',
            validate: { params: uploadIdParamSchema }
          },
          handler: statusHandler
        },
        {
          method: 'GET',
          path: '/api/uploads/{uploadId}',
          options: {
            auth: 'api-bearer',
            validate: { params: uploadIdParamSchema }
          },
          handler: detailsHandler
        }
      ])
    }
  }
}
