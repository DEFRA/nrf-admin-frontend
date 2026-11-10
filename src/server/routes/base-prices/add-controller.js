import { statusCodes } from '#/server/common/constants/status-codes.js'
import { addBasePrice } from '#/server/common/services/impact-assessor-base-prices.js'
import { basePricesPath, DEFAULT_EDP_ID } from './constants.js'
import { buildFormViewModel, redirectToFormWithErrors } from './form-page.js'
import {
  emptyFormValues,
  isFuture,
  loadDefaultEdp,
  takeFormState
} from './form-state.js'
import {
  basePriceFormPayloadSchema,
  validateBasePriceForm
} from './form-validation.js'
import {
  futureExistsStatus,
  notificationFor,
  redirectToList
} from './notifications.js'
import { getStaffDetails } from './staff-details.js'

export const addBasePriceFormController = {
  async handler(request, h) {
    const edp = await loadDefaultEdp()

    const now = new Date()
    if (edp.basePrices.some((basePrice) => isFuture({ basePrice, now }))) {
      return redirectToList({ h, notification: 'base-price-future-exists' })
    }

    return h.view(
      'base-prices/form',
      buildFormViewModel({
        request,
        edpName: edp.edpName,
        state: takeFormState({ request, defaultValues: emptyFormValues() }),
        page: { heading: 'Add a base price', backHref: basePricesPath }
      })
    )
  }
}

export const addBasePriceController = {
  options: {
    validate: {
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

    const result = await addBasePrice({
      edpId: DEFAULT_EDP_ID,
      ...value,
      ...getStaffDetails(request)
    })

    return redirectToList({
      h,
      notification: notificationFor({
        result,
        success: 'base-price-added',
        byStatus: futureExistsStatus
      })
    }).code(statusCodes.redirectAfterPost)
  }
}
