import { ukLocalToUtc } from './uk-local-time.js'

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/
const DAY_OR_MONTH_PATTERN = /^\d{1,2}$/
const YEAR_PATTERN = /^\d{4}$/

/**
 * @typedef {import('./uk-local-time.js').LocalDateTime} LocalDateTime
 * @typedef {Pick<LocalDateTime, 'year' | 'month' | 'day'>} LocalDate
 * @typedef {Pick<LocalDateTime, 'hour' | 'minute'>} LocalTime
 */

/**
 * @param {{ date: { day: string, month: string, year: string }, subject: string }} params
 * @returns {{ value?: LocalDate, error?: string }}
 */
function validateDate({ date: { day, month, year }, subject }) {
  const parts = { day, month, year }
  const missing = Object.keys(parts).filter((name) => !parts[name])
  if (missing.length === Object.keys(parts).length) {
    return { error: `Enter the date the ${subject} takes effect` }
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
    ? { value: { year: Number(year), month: Number(month), day: Number(day) } }
    : { error: 'The date must be a real date' }
}

/**
 * @param {{ rawTime: string, subject: string }} params
 * @returns {{ value?: LocalTime, error?: string }}
 */
function validateTime({ rawTime, subject }) {
  if (!rawTime) {
    return { error: `Enter the time the ${subject} takes effect` }
  }
  const match = TIME_PATTERN.exec(rawTime)
  if (!match) {
    return {
      error: 'Enter a time in the 24-hour format, like 00:00 or 14:30'
    }
  }
  return { value: { hour: Number(match[1]), minute: Number(match[2]) } }
}

/**
 * @param {{ date: LocalDate, time: LocalTime, now: Date }} params
 * @returns {{ value?: string, dateError?: string, timeError?: string }}
 */
function validateFuture({ date, time, now }) {
  const instant = ukLocalToUtc({ ...date, ...time })
  if (!instant) {
    return {
      timeError:
        'That time does not exist because the clocks go forward. Enter a different time'
    }
  }
  if (instant <= now) {
    return { dateError: 'The date and time must be in the future' }
  }
  return { value: instant.toISOString() }
}

/**
 * Checks a date (day, month and year inputs) and a 24-hour time entered in UK
 * local time. A problem with the date is reported as `dateError` and a problem
 * with the time as `timeError`, so each can be shown against its own input.
 *
 * @param {object} params
 * @param {{ day: string, month: string, year: string }} params.date
 * @param {string} params.time
 * @param {Date} params.now
 * @param {string} params.subject What takes effect, for error messages, e.g. "base price"
 * @returns {{ value?: string, dateError?: string, timeError?: string }} `value` is the UTC instant as an ISO string, and only for a time in the future
 */
export function validateFutureUkDateTime({ date, time, now, subject }) {
  const dateResult = validateDate({ date, subject })
  const timeResult = validateTime({ rawTime: time, subject })

  if (dateResult.value && timeResult.value) {
    return validateFuture({
      date: dateResult.value,
      time: timeResult.value,
      now
    })
  }
  return { dateError: dateResult.error, timeError: timeResult.error }
}
