import Joi from 'joi'

import { getBasePrices } from '#/server/common/services/impact-assessor.js'
import {
  addBasePricePath,
  changeBasePricePath,
  DEFAULT_EDP_ID,
  deleteBasePricePath
} from './constants.js'
import { isFuture } from './form-state.js'
import { notifications } from './notifications.js'

/**
 * @param {{ edps: import('./form-state.js').EdpBasePrices[], now: Date }} params
 */
const toViewModel = ({ edps, now }) =>
  edps.map((edp) => ({
    ...edp,
    basePrices: edp.basePrices.map((basePrice) => ({
      ...basePrice,
      isFuture: isFuture({ basePrice, now }),
      changePath: changeBasePricePath(basePrice.id),
      deletePath: deleteBasePricePath(basePrice.id)
    })),
    canAdd:
      edp.edpId === DEFAULT_EDP_ID &&
      !edp.basePrices.some((basePrice) => isFuture({ basePrice, now }))
  }))

export const listBasePricesController = {
  options: {
    validate: {
      query: Joi.object({
        notification: Joi.string().valid(...Object.keys(notifications))
      })
    }
  },
  async handler(request, h) {
    const result = await getBasePrices()

    return h.view('base-prices/index', {
      pageTitle: 'Base prices',
      heading: 'Base prices',
      addPath: addBasePricePath,
      banner: notifications[request.query.notification],
      errorMessage: result.error
        ? 'Base prices could not be loaded. Check the logs for details.'
        : undefined,
      edps: result.edps
        ? toViewModel({ edps: result.edps, now: new Date() })
        : []
    })
  }
}
