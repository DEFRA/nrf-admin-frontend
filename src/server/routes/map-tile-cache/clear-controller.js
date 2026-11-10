import joi from 'joi'

import { clearFrontendTileCache } from '../../common/services/nrf-frontend.js'
import { createLogger } from '../../common/helpers/logging/logger.js'
import { statusCodes } from '../../common/constants/status-codes.js'

const logger = createLogger()

export const clearTileCacheController = {
  options: {
    validate: {
      payload: joi.object({})
    }
  },
  async handler(_request, h) {
    try {
      const count = await clearFrontendTileCache()
      return h
        .redirect(
          `/map-tile-cache?notification=tile-cache-cleared&count=${count}`
        )
        .code(statusCodes.redirectAfterPost)
    } catch (error) {
      logger.error(error, 'Failed to clear tile cache')
      return h
        .redirect('/map-tile-cache?notification=tile-cache-error')
        .code(statusCodes.redirectAfterPost)
    }
  }
}
