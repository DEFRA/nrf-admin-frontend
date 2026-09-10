import { bulkDeleteConfirmController } from './confirm-controller.js'
import { bulkDeleteController } from './delete-controller.js'

/**
 * Sets up the routes used to bulk delete quotes from the quotes table.
 * These routes are registered in src/server/plugins/router.js.
 */
export const quotesBulkDelete = {
  plugin: {
    name: 'quotesBulkDelete',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/quotes/delete',
          ...bulkDeleteConfirmController
        },
        {
          method: 'POST',
          path: '/quotes/delete',
          ...bulkDeleteController
        }
      ])
    }
  }
}
