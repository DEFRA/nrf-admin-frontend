import { statusCodes } from '#/server/common/constants/status-codes.js'
import { getStaffDetails } from '#/server/common/helpers/staff-details.js'
import { addInflationIndex } from '#/server/common/services/impact-assessor-inflation-index.js'
import { inflationIndexPath } from './constants.js'
import { buildFormViewModel, redirectToFormWithErrors } from './form-page.js'
import {
  availableYears,
  emptyFormValues,
  loadInflationIndexes,
  takeFormState
} from './form-state.js'
import {
  inflationIndexFormPayloadSchema,
  validateInflationIndexForm
} from './form-validation.js'
import {
  notificationFor,
  redirectToList,
  yearExistsStatus
} from './notifications.js'

export const addInflationIndexFormController = {
  async handler(request, h) {
    const inflationIndexes = await loadInflationIndexes()
    const now = new Date()
    const years = availableYears({ inflationIndexes, now })

    if (years.length === 0) {
      return redirectToList({
        h,
        notification: 'inflation-index-year-exists'
      })
    }

    return h.view(
      'inflation-index/form',
      buildFormViewModel({
        request,
        years,
        state: takeFormState({ request, defaultValues: emptyFormValues() }),
        page: {
          heading: 'Add an inflation index',
          backHref: inflationIndexPath
        }
      })
    )
  }
}

export const addInflationIndexController = {
  options: {
    validate: {
      payload: inflationIndexFormPayloadSchema
    }
  },
  async handler(request, h) {
    const { errors, value } = validateInflationIndexForm(
      { payload: request.payload, now: new Date() },
      { requireYear: true }
    )
    if (!value) {
      return redirectToFormWithErrors({ request, h, errors })
    }

    const result = await addInflationIndex({
      ...value,
      ...getStaffDetails(request)
    })

    return redirectToList({
      h,
      notification: notificationFor({
        result,
        success: 'inflation-index-added',
        byStatus: yearExistsStatus
      })
    }).code(statusCodes.redirectAfterPost)
  }
}
