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
import {
  notificationFor,
  redirectToList,
  takenEffectStatus
} from './notifications.js'
import { idParamSchema } from './schemas.js'
import { getStaffDetails } from '#/server/common/helpers/staff-details.js'

export const changeBasePriceFormController = {
  options: {
    validate: {
      params: idParamSchema
    }
  },
  async handler(request, h) {
    const { edp, basePrice } = await loadBasePrice(request.params.id)

    if (!isFuture({ basePrice, now: new Date() })) {
      return redirectToList({ h, notification: 'base-price-taken-effect' })
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

    return redirectToList({ h, notification }).code(
      statusCodes.redirectAfterPost
    )
  }
}
