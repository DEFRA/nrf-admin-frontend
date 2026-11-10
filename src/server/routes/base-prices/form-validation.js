import Joi from 'joi'

import { ukLocalToUtc } from '#/server/common/helpers/uk-local-time.js'

export const MAX_COMMENT_LENGTH = 500

const MAX_PRICE_INPUT_LENGTH = 30
const MAX_DATE_PART_LENGTH = 10
const MAX_TIME_INPUT_LENGTH = 10
const COMMENT_INPUT_HEADROOM = 4

const NONEXISTENT_TIME_ERROR = 'That time does not exist'
const MAX_BASE_PRICE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/
const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/
const DAY_OR_MONTH_PATTERN = /^\d{1,2}$/
const YEAR_PATTERN = /^\d{4}$/

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
 * @param {string} rawPrice
 * @returns {{ basePrice?: number, error?: string }}
 */
function validateBasePrice(rawPrice) {
  if (!rawPrice) {
    return { error: 'Enter the base price' }
  }
  const amount = rawPrice.replace(/^£/, '').replaceAll(',', '')
  if (!MAX_BASE_PRICE_PATTERN.test(amount) || Number(amount) <= 0) {
    return {
      error:
        'Enter a valid base price, like 2675 or 2675.50. It must be more than £0, under £100,000,000 and have no more than 2 decimal places'
    }
  }
  return { basePrice: Number(amount) }
}

/**
 * @param {{ day: string, month: string, year: string }} date
 * @returns {{ date?: {year: number, month: number, day: number}, error?: string }}
 */
function validateDate({ day, month, year }) {
  const parts = { day, month, year }
  const missing = Object.keys(parts).filter((name) => !parts[name])
  if (missing.length === Object.keys(parts).length) {
    return { error: 'Enter the date the base price takes effect' }
  }
  if (missing.length > 0) {
    return { error: `The date must include a ${missing.join(' and ')}` }
  }
  if (
    !DAY_OR_MONTH_PATTERN.test(day) ||
    !DAY_OR_MONTH_PATTERN.test(month) ||
    !YEAR_PATTERN.test(year)
  ) {
    return { error: 'The date must be a real date' }
  }
  const check = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  const isRealDate =
    check.getUTCFullYear() === Number(year) &&
    check.getUTCMonth() === Number(month) - 1 &&
    check.getUTCDate() === Number(day)
  return isRealDate
    ? { date: { year: Number(year), month: Number(month), day: Number(day) } }
    : { error: 'The date must be a real date' }
}

/**
 * @param {string} rawTime
 * @returns {{ time?: {hour: number, minute: number}, error?: string }}
 */
function validateTime(rawTime) {
  if (!rawTime) {
    return { error: 'Enter the time the base price takes effect' }
  }
  const match = TIME_PATTERN.exec(rawTime)
  if (!match) {
    return {
      error: 'Enter a time in the 24-hour format, like 00:00 or 14:30'
    }
  }
  return { time: { hour: Number(match[1]), minute: Number(match[2]) } }
}

/**
 * @param {{ date: object, time: object, now: Date }} params
 * @returns {{ effectiveFrom?: string, error?: string }}
 */
function validateEffectiveFrom({ date, time, now }) {
  const instant = ukLocalToUtc({ ...date, ...time })
  if (!instant) {
    return {
      error: `${NONEXISTENT_TIME_ERROR} because the clocks go forward. Enter a different time`
    }
  }
  if (instant <= now) {
    return { error: 'The date and time must be in the future' }
  }
  return { effectiveFrom: instant.toISOString() }
}

/**
 * @param {string} rawComment
 * @returns {{ comment?: string, error?: string }}
 */
function validateComment(rawComment) {
  if (!rawComment) {
    return { error: 'Enter a comment' }
  }
  if (rawComment.length > MAX_COMMENT_LENGTH) {
    return {
      error: `The comment must be ${MAX_COMMENT_LENGTH} characters or fewer`
    }
  }
  return { comment: rawComment }
}

/**
 * A time that does not exist belongs to the time field, a past moment to the date.
 *
 * @param {string | undefined} error
 * @returns {BasePriceFormErrors}
 */
function effectiveFromErrors(error) {
  if (!error) {
    return {}
  }
  return error.startsWith(NONEXISTENT_TIME_ERROR)
    ? { effectiveFromTime: error }
    : { effectiveFrom: error }
}

/**
 * Checks every field of the add and change forms, entered in UK local time.
 *
 * @param {object} params
 * @param {Record<string, string>} params.payload Validated by basePriceFormPayloadSchema
 * @param {Date} params.now
 * @returns {{ errors: BasePriceFormErrors, value?: { basePrice: number, effectiveFrom: string, comment: string } }}
 */
export function validateBasePriceForm({ payload, now }) {
  const price = validateBasePrice(payload.basePrice)
  const dateResult = validateDate({
    day: payload['effectiveFrom-day'],
    month: payload['effectiveFrom-month'],
    year: payload['effectiveFrom-year']
  })
  const timeResult = validateTime(payload.effectiveFromTime)
  const comment = validateComment(payload.comment)

  const effective =
    dateResult.date && timeResult.time
      ? validateEffectiveFrom({
          date: dateResult.date,
          time: timeResult.time,
          now
        })
      : {}
  const errors = {
    ...(price.error && { basePrice: price.error }),
    ...(dateResult.error && { effectiveFrom: dateResult.error }),
    ...effectiveFromErrors(effective.error),
    ...(timeResult.error && { effectiveFromTime: timeResult.error }),
    ...(comment.error && { comment: comment.error })
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }
  return {
    errors,
    value: {
      basePrice: price.basePrice,
      effectiveFrom: effective.effectiveFrom,
      comment: comment.comment
    }
  }
}
