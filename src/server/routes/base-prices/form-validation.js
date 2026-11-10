import Joi from 'joi'

import { validateComment } from '#/server/common/helpers/validate-comment.js'
import { validatePrice } from '#/server/common/helpers/validate-price.js'
import { validateFutureUkDateTime } from '#/server/common/helpers/validate-uk-date-time.js'

export const MAX_COMMENT_LENGTH = 500

const MAX_PRICE_INPUT_LENGTH = 30
const MAX_DATE_PART_LENGTH = 10
const MAX_TIME_INPUT_LENGTH = 10
const COMMENT_INPUT_HEADROOM = 4

// Generous shape limits only; the user-facing rules and messages are in
// validateBasePriceForm so every problem is reported on one page
const field = (max) => Joi.string().trim().max(max).allow('').default('')

export const basePriceFormPayloadSchema = Joi.object({
  basePrice: field(MAX_PRICE_INPUT_LENGTH),
  'effectiveFrom-day': field(MAX_DATE_PART_LENGTH),
  'effectiveFrom-month': field(MAX_DATE_PART_LENGTH),
  'effectiveFrom-year': field(MAX_DATE_PART_LENGTH),
  effectiveFromTime: field(MAX_TIME_INPUT_LENGTH),
  comment: field(MAX_COMMENT_LENGTH * COMMENT_INPUT_HEADROOM)
})

/**
 * @typedef {object} BasePriceFormErrors
 * @property {string} [basePrice]
 * @property {string} [effectiveFrom]
 * @property {string} [effectiveFromTime]
 * @property {string} [comment]
 */

/**
 * Checks every field of the add and change forms, entered in UK local time.
 *
 * @param {object} params
 * @param {Record<string, string>} params.payload Validated by basePriceFormPayloadSchema
 * @param {Date} params.now
 * @returns {{ errors: BasePriceFormErrors, value?: { basePrice: number, effectiveFrom: string, comment: string } }}
 */
export function validateBasePriceForm({ payload, now }) {
  const price = validatePrice({
    rawPrice: payload.basePrice,
    label: 'base price'
  })
  const effective = validateFutureUkDateTime({
    date: {
      day: payload['effectiveFrom-day'],
      month: payload['effectiveFrom-month'],
      year: payload['effectiveFrom-year']
    },
    time: payload.effectiveFromTime,
    now,
    subject: 'base price'
  })
  const comment = validateComment({
    rawComment: payload.comment,
    maxLength: MAX_COMMENT_LENGTH
  })

  const errors = {
    ...(price.error && { basePrice: price.error }),
    ...(effective.dateError && { effectiveFrom: effective.dateError }),
    ...(effective.timeError && { effectiveFromTime: effective.timeError }),
    ...(comment.error && { comment: comment.error })
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }
  return {
    errors,
    value: {
      basePrice: price.value,
      effectiveFrom: effective.value,
      comment: comment.value
    }
  }
}
