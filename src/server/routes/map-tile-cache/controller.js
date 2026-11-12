import joi from 'joi'

import { clearTileCachePath } from './constants.js'

export const tileCacheController = {
  options: {
    validate: {
      query: joi.object({
        notification: joi
          .string()
          .valid('tile-cache-cleared', 'tile-cache-error'),
        count: joi.number().integer().min(0)
      })
    }
  },
  handler(request, h) {
    const { notification, count } = request.query
    return h.view('map-tile-cache/index', {
      pageTitle: 'Map tile cache',
      heading: 'Map tile cache',
      notification,
      clearPath: clearTileCachePath,
      clearedCount: count
    })
  }
}
