import { config } from '#/config/config.js'

import {
  initiateBodySchema,
  uploadIdParamSchema,
  listFilesQuerySchema
} from './schemas.js'
import {
  initiateHandler,
  uploadHandler,
  filesHandler,
  statusHandler,
  detailsHandler
} from './controller.js'

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
          // CDP Uploader returns a relative uploadUrl of this exact shape; the
          // client posts the file here and we stream it straight through.
          method: 'POST',
          path: '/upload-and-scan/{uploadId}',
          options: {
            auth: 'api-bearer',
            validate: { params: uploadIdParamSchema },
            payload: {
              output: 'stream',
              parse: false,
              maxBytes: config.get('cdpUploader.maxFileSize')
            }
          },
          handler: uploadHandler
        },
        {
          // Literal path: hapi matches this ahead of /api/uploads/{uploadId}.
          method: 'GET',
          path: '/api/uploads/files',
          options: {
            auth: 'api-bearer',
            validate: { query: listFilesQuerySchema }
          },
          handler: filesHandler
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
