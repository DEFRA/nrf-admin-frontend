import Joi from 'joi'

import { statusCodes } from '#/server/common/constants/status-codes.js'
import { deleteInflationIndex } from '#/server/common/services/impact-assessor-inflation-index.js'
import { inflationIndexPath } from './constants.js'
import { isFuture, loadInflationIndex } from './form-state.js'
import { notificationForDelete, redirectToList } from './notifications.js'
import { idParamSchema } from './schemas.js'

export const deleteInflationIndexConfirmController = {
  options: {
    validate: {
      params: idParamSchema
    }
  },
  async handler(request, h) {
    const { id } = request.params
    const inflationIndex = await loadInflationIndex(id)

    if (!isFuture({ inflationIndex, now: new Date() })) {
      return redirectToList({ h, notification: 'inflation-index-taken-effect' })
    }

    return h.view('inflation-index/delete', {
      pageTitle: 'Delete this inflation index?',
      heading: 'Delete this inflation index?',
      backHref: inflationIndexPath,
      formAction: request.path,
      inflationIndex
    })
  }
}

export const deleteInflationIndexController = {
  options: {
    validate: {
      params: idParamSchema,
      payload: Joi.object({})
    }
  },
  async handler(request, h) {
    const result = await deleteInflationIndex(request.params.id)
    const notification = notificationForDelete({ result })

    return redirectToList({ h, notification }).code(
      statusCodes.redirectAfterPost
    )
  }
}
