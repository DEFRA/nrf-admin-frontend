import { confirmDeleteController } from './confirm-controller.js'
import { deleteQuoteController } from './delete-controller.js'

/**
 * Sets up the routes used in the delete quote confirmation page.
 * These routes are registered in src/server/plugins/router.js.
 */
export const quoteDelete = {
  plugin: {
    name: 'quoteDelete',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/quote/{reference}/delete',
          ...confirmDeleteController
        },
        {
          method: 'POST',
          path: '/quote/{reference}/delete',
          ...deleteQuoteController
        }
      ])
    }
  }
}
