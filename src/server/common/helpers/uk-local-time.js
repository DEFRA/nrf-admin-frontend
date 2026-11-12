const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
// Intl's en-GB short month gives "Sept"; the service style is "Sep"
const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

const ukFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23'
})

/**
 * @typedef {object} LocalDateTime
 * @property {number} year
 * @property {number} month 1 to 12
 * @property {number} day
 * @property {number} hour 0 to 23
 * @property {number} minute
 */

/**
 * @param {Date} date
 * @returns {LocalDateTime} the date and time on a UK wall clock
 */
const toUkLocal = (date) =>
  Object.fromEntries(
    ukFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)])
  )

/**
 * @param {string | Date} value A UTC instant
 * @returns {LocalDateTime}
 */
export const utcToUkLocal = (value) => toUkLocal(new Date(value))

/**
 * Converts a UK wall clock time to the UTC instant it names.
 * Returns null for a time that doesn't exist (skipped at the spring clock
 * change). A time repeated at the autumn clock change is the first occurrence.
 *
 * @param {LocalDateTime} local
 * @returns {Date | null}
 */
export function ukLocalToUtc(local) {
  const { year, month, day, hour, minute } = local
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  // The UK is UTC+0 or UTC+1, so the instant is one of two candidates, earliest first
  const candidates = [
    wallClockAsUtc - MINUTES_PER_HOUR * MS_PER_MINUTE,
    wallClockAsUtc
  ]
  const match = candidates.find((ms) => {
    const ukTime = toUkLocal(new Date(ms))
    return (
      ukTime.year === year &&
      ukTime.month === month &&
      ukTime.day === day &&
      ukTime.hour === hour &&
      ukTime.minute === minute
    )
  })
  return match === undefined ? null : new Date(match)
}

/**
 * @param {string | Date | null | undefined} value A UTC instant
 * @returns {string} e.g. "8 Sep 2026 at 08:35", in UK local time, or "–" when there is no valid date
 */
export function formatUkDateTime(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return '–'
  }
  const { year, month, day, hour, minute } = utcToUkLocal(value)
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  return `${day} ${MONTH_ABBREVIATIONS[month - 1]} ${year} at ${time}`
}
