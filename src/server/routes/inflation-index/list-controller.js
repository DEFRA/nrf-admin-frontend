import Joi from 'joi'

import { getInflationIndexes } from '#/server/common/services/impact-assessor-inflation-index.js'
import {
  addInflationIndexPath,
  changeInflationIndexPath,
  deleteInflationIndexPath,
  inflationIndexDetailsPath
} from './constants.js'
import { availableYears, isFuture } from './form-state.js'
import { notifications } from './notifications.js'
import { toTableRows } from './table-rows.js'

/**
 * @param {{ inflationIndexes: import('./form-state.js').InflationIndex[], now: Date }} params
 * @returns {InflationIndexViewModel[]}
 */
const toViewModel = ({ inflationIndexes, now }) => {
  const currentYear = now.getUTCFullYear()
  return inflationIndexes.map((inflationIndex) => ({
    ...inflationIndex,
    isFuture: isFuture({ inflationIndex, now }),
    isInForce: inflationIndex.chargingYear === currentYear,
    detailsPath: inflationIndexDetailsPath(inflationIndex.id),
    changePath: changeInflationIndexPath(inflationIndex.id),
    deletePath: deleteInflationIndexPath(inflationIndex.id)
  }))
}

/**
 * @typedef {object} InflationIndexViewModel
 * @property {string} id
 * @property {number} chargingYear
 * @property {number} cilIndex
 * @property {number} indexFactor
 * @property {boolean} isFuture
 * @property {boolean} isInForce
 * @property {string} detailsPath
 * @property {string} changePath
 * @property {string} deletePath
 */

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
    const inflationIndexes = result.inflationIndexes
      ? toViewModel({ inflationIndexes: result.inflationIndexes, now })
      : []

    return h.view('inflation-index/index', {
      pageTitle: 'Inflation index',
      heading: 'Inflation index',
      addPath: addInflationIndexPath,
      banner: notifications[request.query.notification],
      errorMessage: result.error
        ? 'Inflation indexes could not be loaded. Check the logs for details.'
        : undefined,
      tableRows: toTableRows({ inflationIndexes }),
      hasIndexes: inflationIndexes.length > 0,
      canAdd:
        !result.error &&
        availableYears({
          inflationIndexes: result.inflationIndexes ?? [],
          now
        }).length > 0
    })
  }
}
