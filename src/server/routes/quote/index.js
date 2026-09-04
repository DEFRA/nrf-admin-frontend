import { quoteController } from './controller.js'

/**
 * Sets up the routes used in the quote page.
 * These routes are registered in src/server/router.js.
 */
export const quote = {
  plugin: {
    name: 'quote',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/quote/{reference}',
          ...quoteController
        }
      ])
    }
  }
}
