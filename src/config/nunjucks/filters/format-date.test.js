import { formatDateTime } from './format-date.js'

describe('#formatDateTime', () => {
  test('formats an ISO string as "d MMM yyyy at HH:mm"', () => {
    expect(formatDateTime('2026-01-08T08:35:00.000Z')).toBe(
      '8 Jan 2026 at 08:35'
    )
  })

  test('formats a Date object', () => {
    expect(formatDateTime(new Date('2026-01-08T08:35:00.000Z'))).toBe(
      '8 Jan 2026 at 08:35'
    )
  })
})
