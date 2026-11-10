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

  it('rejects an invalid base price against the base price field', () => {
    expect(validate({ basePrice: '2675,50' }).errors).toEqual({
      basePrice: expect.stringContaining('Enter a valid base price')
    })
  })

  it('rejects a date in the past against the date field', () => {
    expect(validate({ 'effectiveFrom-year': '2025' }).errors).toEqual({
      effectiveFrom: 'The date and time must be in the future'
    })
  })

  it('rejects a time skipped when the clocks go forward against the time field', () => {
    const result = validate({
      'effectiveFrom-day': '28',
      effectiveFromTime: '01:30'
    })

    expect(result.errors).toEqual({
      effectiveFromTime: expect.stringContaining('clocks go forward')
    })
  })

  it('rejects a missing comment against the comment field', () => {
    expect(validate({ comment: '' }).errors).toEqual({
      comment: 'Enter a comment'
    })
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
