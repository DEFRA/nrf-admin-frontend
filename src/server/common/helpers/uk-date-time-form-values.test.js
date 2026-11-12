import {
  emptyUkDateTimeFormValues,
  ukDateTimeFormValues
} from './uk-date-time-form-values.js'

describe('uk date time form values', () => {
  it('starts with blank date inputs and the time at the start of the day', () => {
    expect(emptyUkDateTimeFormValues('startsOn')).toEqual({
      'startsOn-day': '',
      'startsOn-month': '',
      'startsOn-year': '',
      startsOnTime: '00:00'
    })
  })

  it.each([
    ['winter', '2027-01-05T09:05:00Z', ['5', '1', '2027', '09:05']],
    ['summer', '2027-07-05T09:05:00Z', ['5', '7', '2027', '10:05']]
  ])('fills the inputs in UK local time in %s', (_season, utc, expected) => {
    const [day, month, year, time] = expected

    expect(ukDateTimeFormValues({ prefix: 'startsOn', utc })).toEqual({
      'startsOn-day': day,
      'startsOn-month': month,
      'startsOn-year': year,
      startsOnTime: time
    })
  })
})
