import { validatePrice } from './validate-price.js'

const label = 'base price'

describe('validatePrice', () => {
  it.each([
    ['£2,700', 2700],
    ['1,234,567.50', 1234567.5],
    ['2700', 2700],
    ['0.01', 0.01],
    ['99999999.99', 99999999.99]
  ])('accepts %s', (rawPrice, expected) => {
    expect(validatePrice({ rawPrice, label })).toEqual({ value: expected })
  })

  it.each([
    ['', 'Enter the base price'],
    ['abc', 'Enter a valid base price'],
    ['0', 'Enter a valid base price'],
    ['-5', 'Enter a valid base price'],
    ['12.345', 'Enter a valid base price'],
    ['2675,50', 'Enter a valid base price'],
    ['1,2,3', 'Enter a valid base price'],
    ['12,34', 'Enter a valid base price'],
    ['100000000', 'Enter a valid base price']
  ])('rejects "%s"', (rawPrice, message) => {
    expect(validatePrice({ rawPrice, label }).error).toContain(message)
  })

  it('names the price in the error', () => {
    expect(
      validatePrice({ rawPrice: '', label: 'inflation price' }).error
    ).toBe('Enter the inflation price')
  })
})
