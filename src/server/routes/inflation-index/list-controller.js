import Joi from 'joi'

import { getInflationIndexes } from '#/server/common/services/impact-assessor-inflation-index.js'
import {
  addInflationIndexPath,
  changeInflationIndexPath,
  deleteInflationIndexPath
} from './constants.js'
import { availableYears, isFuture } from './form-state.js'
import { notifications } from './notifications.js'

/**
 * @param {{ inflationIndexes: import('./form-state.js').InflationIndex[], now: Date }} params
 */
const toViewModel = ({ inflationIndexes, now }) => {
  const currentYear = now.getUTCFullYear()
  return inflationIndexes.map((inflationIndex) => ({
    ...inflationIndex,
    isFuture: isFuture({ inflationIndex, now }),
    isInForce: inflationIndex.chargingYear === currentYear,
    changePath: changeInflationIndexPath(inflationIndex.id),
    deletePath: deleteInflationIndexPath(inflationIndex.id)
  }))
}

export const listInflationIndexesController = {
  options: {
    validate: {
      query: Joi.object({
        notification: Joi.string().valid(...Object.keys(notifications))
      })
    }
  },
  async handler(request, h) {
    const result = await getInflationIndexes()
    const now = new Date()

    return h.view('inflation-index/index', {
      pageTitle: 'Inflation index',
      heading: 'Inflation index',
      addPath: addInflationIndexPath,
      banner: notifications[request.query.notification],
      errorMessage: result.error
        ? 'Inflation indexes could not be loaded. Check the logs for details.'
        : undefined,
      inflationIndexes: result.inflationIndexes
        ? toViewModel({ inflationIndexes: result.inflationIndexes, now })
        : [],
      canAdd:
        !result.error &&
        availableYears({
          inflationIndexes: result.inflationIndexes ?? [],
          now
        }).length > 0
    })
  }
}
