import { utcToUkLocal } from './uk-local-time.js'

const TWO_DIGITS = 2
const START_OF_DAY = '00:00'

const pad = (number) => String(number).padStart(TWO_DIGITS, '0')

/**
 * Input names for a date input plus a time input: `<prefix>-day`,
 * `<prefix>-month`, `<prefix>-year` and `<prefix>Time`.
 *
 * @param {string} prefix
 */
const names = (prefix) => ({
  day: `${prefix}-day`,
  month: `${prefix}-month`,
  year: `${prefix}-year`,
  time: `${prefix}Time`
})

/**
 * @param {string} prefix
 * @returns {Record<string, string>} Blank date inputs, with the time at the start of the day
 */
export function emptyUkDateTimeFormValues(prefix) {
  const { day, month, year, time } = names(prefix)
  return { [day]: '', [month]: '', [year]: '', [time]: START_OF_DAY }
}

/**
 * @param {object} params
 * @param {string} params.prefix
 * @param {string | Date} params.utc A UTC instant
 * @returns {Record<string, string>} The date and time inputs for that instant, in UK local time
 */
export function ukDateTimeFormValues({ prefix, utc }) {
  const { year, month, day, hour, minute } = utcToUkLocal(utc)
  const input = names(prefix)
  return {
    [input.day]: String(day),
    [input.month]: String(month),
    [input.year]: String(year),
    [input.time]: `${pad(hour)}:${pad(minute)}`
  }
}
