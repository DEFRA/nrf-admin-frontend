import { statusCodes } from '#/server/common/constants/status-codes.js'
import { getStaffDetails } from '#/server/common/helpers/staff-details.js'
import { updateInflationIndex } from '#/server/common/services/impact-assessor-inflation-index.js'
import { inflationIndexPath } from './constants.js'
import { buildFormViewModel, redirectToFormWithErrors } from './form-page.js'
import {
  formValuesFor,
  isFuture,
  loadInflationIndex,
  takeFormState
} from './form-state.js'
import {
  inflationIndexFormPayloadSchema,
  validateInflationIndexForm
} from './form-validation.js'
import {
  notificationFor,
  redirectToList,
  takenEffectStatus
} from './notifications.js'
import { idParamSchema } from './schemas.js'

export const changeInflationIndexFormController = {
  options: {
    validate: {
      params: idParamSchema
    }
  },
  async handler(request, h) {
    const inflationIndex = await loadInflationIndex(request.params.id)

    if (!isFuture({ inflationIndex, now: new Date() })) {
      return redirectToList({ h, notification: 'inflation-index-taken-effect' })
    }

    return h.view(
      'inflation-index/form',
      buildFormViewModel({
        request,
        chargingYear: String(inflationIndex.chargingYear),
        state: takeFormState({
          request,
          defaultValues: formValuesFor(inflationIndex)
        }),
        page: {
          heading: 'Change the inflation index',
          backHref: inflationIndexPath
        }
      })
    )
  }
}

export const changeInflationIndexController = {
  options: {
    validate: {
      params: idParamSchema,
      payload: inflationIndexFormPayloadSchema
    }
  },
  async handler(request, h) {
    const { errors, value } = validateInflationIndexForm({
      payload: request.payload,
      now: new Date()
    })
    if (!value) {
      return redirectToFormWithErrors({ request, h, errors })
    }

    const result = await updateInflationIndex({
      id: request.params.id,
      changes: { ...value, ...getStaffDetails(request) }
    })
    const notification = notificationFor({
      result,
      success: 'inflation-index-changed',
      byStatus: takenEffectStatus
    })

    return redirectToList({ h, notification }).code(
      statusCodes.redirectAfterPost
    )
  }
}
