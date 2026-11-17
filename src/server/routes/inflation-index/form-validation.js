import Joi from 'joi'

import { validateJiraTicket } from '#/server/common/helpers/jira-ticket.js'
import { sanitizedText } from '#/server/common/helpers/sanitized-text.js'
import { toErrors } from '#/server/common/helpers/to-errors.js'
import { validateCilIndex } from '#/server/common/helpers/validate-cil-index.js'
import {
  MAX_COMMENT_LENGTH,
  validateComment
} from '#/server/common/helpers/validate-comment.js'
import {
  MAX_REQUESTOR_LENGTH,
  validateRequestor
} from '#/server/common/helpers/validate-requestor.js'

const MAX_CIL_INDEX_INPUT_LENGTH = 20
const MAX_YEAR_INPUT_LENGTH = 4
const MAX_JIRA_TICKET_INPUT_LENGTH = 50
const TEXT_INPUT_HEADROOM = 4

// Generous shape limits only; the user-facing rules and messages are in
// validateInflationIndexForm so every problem is reported on one page
const field = (max) => Joi.string().trim().max(max).allow('').default('')

export const inflationIndexFormPayloadSchema = Joi.object({
  chargingYear: field(MAX_YEAR_INPUT_LENGTH),
  cilIndex: field(MAX_CIL_INDEX_INPUT_LENGTH),
  requestor: sanitizedText(MAX_REQUESTOR_LENGTH * TEXT_INPUT_HEADROOM),
  jiraTicket: field(MAX_JIRA_TICKET_INPUT_LENGTH),
  comment: sanitizedText(MAX_COMMENT_LENGTH * TEXT_INPUT_HEADROOM)
})

/**
 * @typedef {object} InflationIndexFormErrors
 * @property {string} [chargingYear]
 * @property {string} [cilIndex]
 * @property {string} [requestor]
 * @property {string} [jiraTicket]
 * @property {string} [comment]
 */

/**
 * The year must be a charging year that has not begun: from 1 January of the
 * year after `now` onwards.
 *
 * @param {object} params
 * @param {string} params.chargingYear
 * @param {Date} params.now
 * @returns {{ error?: string }}
 */
const validateChargingYear = ({ chargingYear, now }) => {
  const firstOfferedYear = now.getUTCFullYear() + 1
  if (
    !/^\d{4}$/.test(chargingYear ?? '') ||
    Number(chargingYear) < firstOfferedYear
  ) {
    return { error: 'Select the year the inflation index applies to' }
  }
  return {}
}

/**
 * Checks every field of the add form. The change form fixes the year, so it
 * validates with requireYear false.
 *
 * @param {object} params
 * @param {Record<string, string>} params.payload Validated by inflationIndexFormPayloadSchema
 * @param {Date} params.now
 * @param {{ requireYear?: boolean }} [params.options] requireYear is true on the add form
 * @returns {{ errors: InflationIndexFormErrors, value?: { chargingYear?: number, cilIndex: number, requestor: string, jiraTicket: string, comment: string } }}
 */
export function validateInflationIndexForm(
  { payload, now },
  { requireYear = false } = {}
) {
  const cilIndex = validateCilIndex({ rawCilIndex: payload.cilIndex })
  const requestor = validateRequestor({
    rawRequestor: payload.requestor,
    maxLength: MAX_REQUESTOR_LENGTH
  })
  const jiraTicket = validateJiraTicket(payload.jiraTicket)
  const comment = validateComment({
    rawComment: payload.comment,
    maxLength: MAX_COMMENT_LENGTH
  })

  const errors = toErrors({
    ...(requireYear && {
      chargingYear: validateChargingYear({
        chargingYear: payload.chargingYear,
        now
      })
    }),
    cilIndex,
    requestor,
    jiraTicket,
    comment
  })

  if (Object.keys(errors).length > 0) {
    return { errors }
  }
  return {
    errors,
    value: {
      ...(requireYear && { chargingYear: Number(payload.chargingYear) }),
      cilIndex: cilIndex.value,
      requestor: requestor.value,
      jiraTicket: jiraTicket.value,
      comment: comment.value
    }
  }
}
