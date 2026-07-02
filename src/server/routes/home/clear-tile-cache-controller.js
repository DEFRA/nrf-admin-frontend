import { clearFrontendTileCache } from '../../common/services/nrf-frontend.js'
import { createLogger } from '../../common/helpers/logging/logger.js'

const logger = createLogger()

export const clearTileCacheController = {
  async handler(_request, h) {
    try {
      const count = await clearFrontendTileCache()
      return h.redirect(`/?notification=tile-cache-cleared&count=${count}`)
    } catch (error) {
      logger.error(error, 'Failed to clear tile cache')
      return h.redirect('/?notification=tile-cache-error')
    }
  }
}
