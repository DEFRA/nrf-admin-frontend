import {
  addBasePricePath,
  basePriceDetailsPath,
  basePricesPath,
  changeBasePricePath,
  deleteBasePricePath
} from './constants.js'
import { basePriceDetailsController } from './details-controller.js'
import { listBasePricesController } from './list-controller.js'
import {
  addBasePriceController,
  addBasePriceFormController
} from './add-controller.js'
import {
  changeBasePriceController,
  changeBasePriceFormController
} from './change-controller.js'
import {
  deleteBasePriceConfirmController,
  deleteBasePriceController
} from './delete-controller.js'

/**
 * Sets up the routes used to list, add, change and delete EDP base prices.
 * These routes are registered in src/server/plugins/router.js.
 */
export const basePrices = {
  plugin: {
    name: 'basePrices',
    register(server) {
      server.route([
        { method: 'GET', path: basePricesPath, ...listBasePricesController },
        {
          method: 'GET',
          path: addBasePricePath,
          ...addBasePriceFormController
        },
        {
          method: 'POST',
          path: addBasePricePath,
          ...addBasePriceController
        },
        {
          method: 'GET',
          path: basePriceDetailsPath('{id}'),
          ...basePriceDetailsController
        },
        {
          method: 'GET',
          path: changeBasePricePath('{id}'),
          ...changeBasePriceFormController
        },
        {
          method: 'POST',
          path: changeBasePricePath('{id}'),
          ...changeBasePriceController
        },
        {
          method: 'GET',
          path: deleteBasePricePath('{id}'),
          ...deleteBasePriceConfirmController
        },
        {
          method: 'POST',
          path: deleteBasePricePath('{id}'),
          ...deleteBasePriceController
        }
      ])
    }
  }
}
