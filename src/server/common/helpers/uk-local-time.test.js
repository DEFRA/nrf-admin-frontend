import {
  formatUkDateTime,
  ukLocalToUtc,
  utcToUkLocal
} from './uk-local-time.js'

const local = (year, month, day, hour, minute) => ({
  year,
  month,
  day,
  hour,
  minute
})

describe('ukLocalToUtc', () => {
  it.each([
    [
      'winter time is UTC',
      local(2026, 1, 15, 9, 30),
      '2026-01-15T09:30:00.000Z'
    ],
    [
      'summer time is an hour ahead of UTC',
      local(2026, 7, 15, 9, 30),
      '2026-07-15T08:30:00.000Z'
    ],
    [
      'midnight in summer is 23:00 UTC the day before',
      local(2026, 7, 15, 0, 0),
      '2026-07-14T23:00:00.000Z'
    ],
    [
      'the last minute before the spring clock change',
      local(2027, 3, 28, 0, 59),
      '2027-03-28T00:59:00.000Z'
    ],
    [
      'the first minute after the spring clock change',
      local(2027, 3, 28, 2, 0),
      '2027-03-28T01:00:00.000Z'
    ],
    [
      'a time repeated at the autumn clock change is the first occurrence',
      local(2026, 10, 25, 1, 30),
      '2026-10-25T00:30:00.000Z'
    ],
    [
      'the time after the autumn clock change repeat',
      local(2026, 10, 25, 2, 0),
      '2026-10-25T02:00:00.000Z'
    ]
  ])('converts %s', (_description, input, expected) => {
    expect(ukLocalToUtc(input).toISOString()).toBe(expected)
  })

  it('returns null for a time skipped at the spring clock change', () => {
    expect(ukLocalToUtc(local(2027, 3, 28, 1, 30))).toBeNull()
  })
})

describe('utcToUkLocal', () => {
  it.each([
    ['2026-01-15T09:30:00Z', local(2026, 1, 15, 9, 30)],
    ['2026-07-14T23:00:00Z', local(2026, 7, 15, 0, 0)]
  ])('converts %s to the UK wall clock', (utc, expected) => {
    expect(utcToUkLocal(utc)).toEqual(expected)
  })
})

describe('formatUkDateTime', () => {
  it.each([
    ['2026-09-08T07:35:00Z', '8 Sep 2026 at 08:35'],
    ['2026-01-05T00:00:00Z', '5 Jan 2026 at 00:00']
  ])('formats %s in UK local time', (utc, expected) => {
    expect(formatUkDateTime(utc)).toBe(expected)
  })

  it.each([[null], [undefined], [''], ['not a date']])(
    'shows a hyphen for %s',
    (value) => {
      expect(formatUkDateTime(value)).toBe('–')
    }
  )
})
