import Joi from 'joi'

import { statusCodes } from '#/server/common/constants/status-codes.js'
import { getStaffDetails } from '#/server/common/helpers/staff-details.js'
import {
  MAX_COMMENT_LENGTH,
  validateComment
} from '#/server/common/helpers/validate-comment.js'
import { sanitizedText } from '#/server/common/helpers/sanitized-text.js'
import { deleteInflationIndex } from '#/server/common/services/impact-assessor-inflation-index.js'
import { inflationIndexPath } from './constants.js'
import {
  isFuture,
  loadInflationIndex,
  saveFormState,
  takeFormState,
  toErrorList
} from './form-state.js'
import { notificationForDelete, redirectToList } from './notifications.js'
import { idParamSchema } from './schemas.js'

const MAX_COMMENT_INPUT_LENGTH = 500
const TEXT_INPUT_HEADROOM = 4

// Generous shape limit only; the user-facing rule and message are checked in
// validateComment so the problem is reported on the page
const deletePayloadSchema = Joi.object({
  comment: sanitizedText(MAX_COMMENT_INPUT_LENGTH * TEXT_INPUT_HEADROOM)
})

/** @returns {{ pageTitle: string, heading: string }} */
const pageTitle = () => ({
  pageTitle: 'Delete this inflation index?',
  heading: 'Delete this inflation index?'
})

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

    const state = takeFormState({
      request,
      defaultValues: { comment: '' }
    })

    return h.view('inflation-index/delete', {
      ...pageTitle(),
      backHref: inflationIndexPath,
      formAction: request.path,
      inflationIndex,
      values: state.values,
      errors: state.errors,
      errorList: toErrorList(state.errors),
      maxCommentLength: MAX_COMMENT_LENGTH
    })
  }
}

export const deleteInflationIndexController = {
  options: {
    validate: {
      params: idParamSchema,
      payload: deletePayloadSchema
    }
  },
  async handler(request, h) {
    const { id } = request.params
    const { error, value } = validateComment({
      rawComment: request.payload.comment,
      maxLength: MAX_COMMENT_LENGTH
    })

    if (error) {
      saveFormState({
        request,
        state: {
          values: { comment: request.payload.comment ?? '' },
          errors: { comment: error }
        }
      })
      return h.redirect(request.path).code(statusCodes.redirectAfterPost)
    }

    const result = await deleteInflationIndex({
      id,
      comment: value,
      ...getStaffDetails(request)
    })
    const notification = notificationForDelete({ result })

    return redirectToList({ h, notification }).code(
      statusCodes.redirectAfterPost
    )
  }
}
