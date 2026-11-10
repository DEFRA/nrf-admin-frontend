import { tileCacheController } from './controller.js'
import { clearTileCacheController } from './clear-controller.js'

/**
 * Sets up the routes used in the tile cache page.
 * These routes are registered in src/server/plugins/router.js.
 */
export const tileCache = {
  plugin: {
    name: 'tileCache',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/map-tile-cache',
          ...tileCacheController
        },
        {
          method: 'POST',
          path: '/map-tile-cache/clear',
          ...clearTileCacheController
        }
      ])
    }
  }
}
