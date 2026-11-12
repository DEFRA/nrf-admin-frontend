import Joi from 'joi'

import { validateCilIndex } from '#/server/common/helpers/validate-cil-index.js'
import { validateComment } from '#/server/common/helpers/validate-comment.js'

export const MAX_COMMENT_LENGTH = 500

const MAX_CIL_INDEX_INPUT_LENGTH = 20
const MAX_YEAR_INPUT_LENGTH = 4
const COMMENT_INPUT_HEADROOM = 4

// Generous shape limits only; the user-facing rules and messages are in
// validateInflationIndexForm so every problem is reported on one page
const field = (max) => Joi.string().trim().max(max).allow('').default('')

export const inflationIndexFormPayloadSchema = Joi.object({
  chargingYear: field(MAX_YEAR_INPUT_LENGTH),
  cilIndex: field(MAX_CIL_INDEX_INPUT_LENGTH),
  comment: field(MAX_COMMENT_LENGTH * COMMENT_INPUT_HEADROOM)
})

/**
 * @typedef {object} InflationIndexFormErrors
 * @property {string} [chargingYear]
 * @property {string} [cilIndex]
 * @property {string} [comment]
 */

/**
 * Checks every field of the add form. The change form fixes the year, so it
 * validates with requireYear false.
 *
 * @param {object} params
 * @param {Record<string, string>} params.payload Validated by inflationIndexFormPayloadSchema
 * @param {Date} params.now
 * @param {{ requireYear?: boolean }} [params.options] requireYear is true on the add form
 * @returns {{ errors: InflationIndexFormErrors, value?: { chargingYear?: number, cilIndex: number, comment: string } }}
 */
export function validateInflationIndexForm(
  { payload, now },
  { requireYear = false } = {}
) {
  const errors = {}

  if (requireYear) {
    const year = Number(payload.chargingYear)
    // The year must be a charging year that has not begun: from 1 January of
    // the year after `now` onwards
    const firstOfferedYear = now.getUTCFullYear() + 1
    if (
      !/^\d{4}$/.test(payload.chargingYear ?? '') ||
      year < firstOfferedYear
    ) {
      errors.chargingYear = 'Select the year the inflation index applies to'
    }
  }

  const cilIndex = validateCilIndex({ rawCilIndex: payload.cilIndex })
  if (cilIndex.error) {
    errors.cilIndex = cilIndex.error
  }

  const comment = validateComment({
    rawComment: payload.comment,
    maxLength: MAX_COMMENT_LENGTH
  })
  if (comment.error) {
    errors.comment = comment.error
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }
  return {
    errors,
    value: {
      ...(requireYear && { chargingYear: Number(payload.chargingYear) }),
      cilIndex: cilIndex.value,
      comment: comment.value
    }
  }
}
