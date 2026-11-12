import { validateFutureUkDateTime } from './validate-uk-date-time.js'

const now = new Date('2026-11-10T12:00:00Z')

const validate = ({ date = {}, time = '00:00' } = {}) =>
  validateFutureUkDateTime({
    date: { day: '1', month: '3', year: '2027', ...date },
    time,
    now,
    subject: 'base price'
  })

describe('validateFutureUkDateTime', () => {
  it('returns the UTC instant for a UK local date and time', () => {
    expect(validate({ date: { month: '7' }, time: '09:30' })).toEqual({
      value: '2027-07-01T08:30:00.000Z'
    })
  })

  it.each([
    [
      'no date',
      { day: '', month: '', year: '' },
      'Enter the date the base price takes effect'
    ],
    [
      'a missing month and year',
      { month: '', year: '' },
      'The date must include a month and year'
    ],
    [
      'a date that does not exist',
      { day: '31', month: '2' },
      'The date must be a real date'
    ],
    ['letters in the date', { day: 'ab' }, 'The date must be a real date'],
    [
      'a date in the past',
      { year: '2025' },
      'The date and time must be in the future'
    ]
  ])('rejects %s', (_description, date, message) => {
    expect(validate({ date }).dateError).toBe(message)
  })

  it('rejects earlier today', () => {
    const result = validate({
      date: { day: '10', month: '11', year: '2026' },
      time: '11:59'
    })

    expect(result.dateError).toBe('The date and time must be in the future')
  })

  it.each([
    ['', 'Enter the time the base price takes effect'],
    ['24:00', 'Enter a time in the 24-hour format'],
    ['9am', 'Enter a time in the 24-hour format'],
    ['12:60', 'Enter a time in the 24-hour format']
  ])('rejects the time "%s"', (time, message) => {
    expect(validate({ time }).timeError).toContain(message)
  })

  it('rejects a time skipped when the clocks go forward', () => {
    const result = validate({ date: { day: '28' }, time: '01:30' })

    expect(result).toEqual({
      timeError: expect.stringContaining('clocks go forward')
    })
  })

  it('uses the first occurrence of a time repeated when the clocks go back', () => {
    const result = validate({
      date: { day: '31', month: '10', year: '2027' },
      time: '01:30'
    })

    expect(result.value).toBe('2027-10-31T00:30:00.000Z')
  })
})
