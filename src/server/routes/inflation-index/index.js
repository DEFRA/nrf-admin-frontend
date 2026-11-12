import {
  addInflationIndexPath,
  changeInflationIndexPath,
  deleteInflationIndexPath,
  inflationIndexPath
} from './constants.js'
import { listInflationIndexesController } from './list-controller.js'
import {
  addInflationIndexController,
  addInflationIndexFormController
} from './add-controller.js'
import {
  changeInflationIndexController,
  changeInflationIndexFormController
} from './change-controller.js'
import {
  deleteInflationIndexConfirmController,
  deleteInflationIndexController
} from './delete-controller.js'

/**
 * Sets up the routes used to list, add, change and delete the inflation
 * index. These routes are registered in src/server/plugins/router.js.
 */
export const inflationIndex = {
  plugin: {
    name: 'inflationIndex',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: inflationIndexPath,
          ...listInflationIndexesController
        },
        {
          method: 'GET',
          path: addInflationIndexPath,
          ...addInflationIndexFormController
        },
        {
          method: 'POST',
          path: addInflationIndexPath,
          ...addInflationIndexController
        },
        {
          method: 'GET',
          path: changeInflationIndexPath('{id}'),
          ...changeInflationIndexFormController
        },
        {
          method: 'POST',
          path: changeInflationIndexPath('{id}'),
          ...changeInflationIndexController
        },
        {
          method: 'GET',
          path: deleteInflationIndexPath('{id}'),
          ...deleteInflationIndexConfirmController
        },
        {
          method: 'POST',
          path: deleteInflationIndexPath('{id}'),
          ...deleteInflationIndexController
        }
      ])
    }
  }
}
