import { format, isDate, parseISO } from 'date-fns'

export function formatDateTime(value) {
  const date = isDate(value) ? value : parseISO(value)

  return format(date, "d MMM yyyy 'at' HH:mm")
}
