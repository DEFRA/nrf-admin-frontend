import Boom from '@hapi/boom'
import Joi from 'joi'

import { statusCodes } from '#/server/common/constants/status-codes.js'
import { updateBasePrice } from '#/server/common/services/impact-assessor-base-prices.js'
import { basePricesPath } from './constants.js'
import { buildFormViewModel, redirectToFormWithErrors } from './form-page.js'
import {
  formValuesFor,
  isFuture,
  loadBasePrice,
  takeFormState
} from './form-state.js'
import {
  basePriceFormPayloadSchema,
  validateBasePriceForm
} from './form-validation.js'
import { notificationFor, takenEffectStatus } from './notifications.js'
import { getStaffDetails } from './staff-details.js'

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
})

export const changeBasePriceFormController = {
  options: {
    validate: {
      params: idParamSchema
    }
  },
  async handler(request, h) {
    const { edp, basePrice } = await loadBasePrice(request.params.id)

    if (!basePrice) {
      throw Boom.notFound('Base price not found', {
        message: `No base price found with id ${request.params.id}`
      })
    }
    if (!isFuture({ basePrice, now: new Date() })) {
      return h.redirect(
        `${basePricesPath}?notification=base-price-taken-effect`
      )
    }

    return h.view(
      'base-prices/form',
      buildFormViewModel({
        request,
        edpName: edp.edpName,
        state: takeFormState({
          request,
          defaultValues: formValuesFor(basePrice)
        }),
        page: { heading: 'Change the base price', backHref: basePricesPath }
      })
    )
  }
}

export const changeBasePriceController = {
  options: {
    validate: {
      params: idParamSchema,
      payload: basePriceFormPayloadSchema
    }
  },
  async handler(request, h) {
    const { errors, value } = validateBasePriceForm({
      payload: request.payload,
      now: new Date()
    })
    if (!value) {
      return redirectToFormWithErrors({ request, h, errors })
    }

    const result = await updateBasePrice({
      id: request.params.id,
      changes: { ...value, ...getStaffDetails(request) }
    })
    const notification = notificationFor({
      result,
      success: 'base-price-changed',
      byStatus: takenEffectStatus
    })

    return h
      .redirect(`${basePricesPath}?notification=${notification}`)
      .code(statusCodes.redirectAfterPost)
  }
}
