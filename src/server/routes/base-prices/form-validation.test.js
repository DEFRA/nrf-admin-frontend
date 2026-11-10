import { validateBasePriceForm } from './form-validation.js'

const now = new Date('2026-11-10T12:00:00Z')

const validPayload = {
  basePrice: '2700.50',
  'effectiveFrom-day': '1',
  'effectiveFrom-month': '3',
  'effectiveFrom-year': '2027',
  effectiveFromTime: '00:00',
  comment: 'Advised by NE'
}

const validate = (overrides = {}) =>
  validateBasePriceForm({ payload: { ...validPayload, ...overrides }, now })

describe('validateBasePriceForm', () => {
  it('returns the values to send to the impact assessor, with the date in UTC', () => {
    expect(validate({ 'effectiveFrom-month': '7' })).toEqual({
      errors: {},
      value: {
        basePrice: 2700.5,
        effectiveFrom: '2027-06-30T23:00:00.000Z',
        comment: 'Advised by NE'
      }
    })
  })

  it.each([
    ['£2,700', 2700],
    ['2700', 2700],
    ['0.01', 0.01],
    ['99999999.99', 99999999.99]
  ])('accepts the base price %s', (basePrice, expected) => {
    expect(validate({ basePrice }).value.basePrice).toBe(expected)
  })

  it.each([
    ['', 'Enter the base price'],
    ['abc', 'Enter a valid base price'],
    ['0', 'Enter a valid base price'],
    ['-5', 'Enter a valid base price'],
    ['12.345', 'Enter a valid base price'],
    ['100000000', 'Enter a valid base price']
  ])('rejects the base price "%s"', (basePrice, message) => {
    expect(validate({ basePrice }).errors.basePrice).toContain(message)
  })

  it.each([
    [
      'no date',
      {
        'effectiveFrom-day': '',
        'effectiveFrom-month': '',
        'effectiveFrom-year': ''
      },
      'Enter the date the base price takes effect'
    ],
    [
      'a missing month and year',
      { 'effectiveFrom-month': '', 'effectiveFrom-year': '' },
      'The date must include a month and year'
    ],
    [
      'a date that does not exist',
      { 'effectiveFrom-day': '31', 'effectiveFrom-month': '2' },
      'The date must be a real date'
    ],
    [
      'letters in the date',
      { 'effectiveFrom-day': 'ab' },
      'The date must be a real date'
    ],
    [
      'a date in the past',
      { 'effectiveFrom-year': '2025' },
      'The date and time must be in the future'
    ],
    [
      'earlier today',
      {
        'effectiveFrom-day': '10',
        'effectiveFrom-month': '11',
        'effectiveFrom-year': '2026',
        effectiveFromTime: '11:59'
      },
      'The date and time must be in the future'
    ]
  ])('rejects %s', (_description, overrides, message) => {
    expect(validate(overrides).errors.effectiveFrom).toBe(message)
  })

  it.each([
    ['', 'Enter the time the base price takes effect'],
    ['24:00', 'Enter a time in the 24-hour format'],
    ['9am', 'Enter a time in the 24-hour format'],
    ['12:60', 'Enter a time in the 24-hour format']
  ])('rejects the time "%s"', (effectiveFromTime, message) => {
    expect(validate({ effectiveFromTime }).errors.effectiveFromTime).toContain(
      message
    )
  })

  it('rejects a time skipped when the clocks go forward', () => {
    const result = validate({
      'effectiveFrom-day': '28',
      effectiveFromTime: '01:30'
    })

    expect(result.errors).toEqual({
      effectiveFromTime: expect.stringContaining('clocks go forward')
    })
  })

  it('uses the first occurrence of a time repeated when the clocks go back', () => {
    const result = validate({
      'effectiveFrom-day': '31',
      'effectiveFrom-month': '10',
      'effectiveFrom-year': '2027',
      effectiveFromTime: '01:30'
    })

    expect(result.value.effectiveFrom).toBe('2027-10-31T00:30:00.000Z')
  })

  it.each([
    ['', 'Enter a comment'],
    ['x'.repeat(501), 'The comment must be 500 characters or fewer']
  ])('rejects the comment of %#', (comment, message) => {
    expect(validate({ comment }).errors.comment).toBe(message)
  })

  it('reports every problem at once', () => {
    const { errors } = validateBasePriceForm({
      payload: {
        basePrice: '',
        'effectiveFrom-day': '',
        'effectiveFrom-month': '',
        'effectiveFrom-year': '',
        effectiveFromTime: '',
        comment: ''
      },
      now
    })

    expect(Object.keys(errors)).toEqual([
      'basePrice',
      'effectiveFrom',
      'effectiveFromTime',
      'comment'
    ])
  })
})
