const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

/**
 * @param {string|Date} value
 * @returns {string}
 */
export function govukDate(value) {
  if (!value) return '–'
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) return '–'
  return dateFormatter.format(date)
}
