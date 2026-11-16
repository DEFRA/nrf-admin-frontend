import { validateRequestor } from './validate-requestor.js'

describe('validateRequestor', () => {
  it('accepts a name up to the maximum length', () => {
    expect(
      validateRequestor({ rawRequestor: 'x'.repeat(5), maxLength: 5 })
    ).toEqual({ value: 'xxxxx' })
  })

  it.each([
    ['', 'Enter the name of the person who requested the change'],
    ['x'.repeat(6), 'The requestor name must be 5 characters or fewer']
  ])('rejects the requestor of %#', (rawRequestor, message) => {
    expect(validateRequestor({ rawRequestor, maxLength: 5 }).error).toBe(
      message
    )
  })
})
