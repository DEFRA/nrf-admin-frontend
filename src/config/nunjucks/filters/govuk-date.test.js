import { govukDate } from './govuk-date.js'

describe('govukDate', () => {
  it('formats ISO string as GOV.UK date', () => {
    expect(govukDate('2026-03-23T00:00:00.000Z')).toBe('23 March 2026')
  })

  it('formats Date object', () => {
    expect(govukDate(new Date('2026-06-15T12:00:00.000Z'))).toBe('15 June 2026')
  })

  it('no leading zero on single-digit days', () => {
    expect(govukDate('2026-01-05T00:00:00.000Z')).toBe('5 January 2026')
  })

  it('returns hyphen for null', () => {
    expect(govukDate(null)).toBe('–')
  })

  it('returns hyphen for undefined', () => {
    expect(govukDate(undefined)).toBe('–')
  })

  it('returns hyphen for invalid date string', () => {
    expect(govukDate('not-a-date')).toBe('–')
  })
})
