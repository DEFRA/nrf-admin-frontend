import Joi from 'joi'

import { statusCodes } from '#/server/common/constants/status-codes.js'
import { deleteBasePrice } from '#/server/common/services/impact-assessor-base-prices.js'
import { basePricesPath } from './constants.js'
import { isFuture, loadBasePrice } from './form-state.js'
import {
  notificationFor,
  redirectToList,
  takenEffectStatus
} from './notifications.js'
import { idParamSchema } from './schemas.js'

export const deleteBasePriceConfirmController = {
  options: {
    validate: {
      params: idParamSchema
    }
  },
  async handler(request, h) {
    const { id } = request.params
    const { edp, basePrice } = await loadBasePrice(id)

    if (!isFuture({ basePrice, now: new Date() })) {
      return redirectToList({ h, notification: 'base-price-taken-effect' })
    }

    return h.view('base-prices/delete', {
      pageTitle: 'Delete this base price?',
      heading: 'Delete this base price?',
      backHref: basePricesPath,
      formAction: request.path,
      edpName: edp.edpName,
      basePrice
    })
  }
}

export const deleteBasePriceController = {
  options: {
    validate: {
      params: idParamSchema,
      payload: Joi.object({})
    }
  },
  async handler(request, h) {
    const result = await deleteBasePrice(request.params.id)
    const notification = notificationFor({
      result,
      success: 'base-price-deleted',
      byStatus: takenEffectStatus
    })

    return redirectToList({ h, notification }).code(
      statusCodes.redirectAfterPost
    )
  }
}
