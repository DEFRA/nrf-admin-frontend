import { validateComment } from './validate-comment.js'

describe('validateComment', () => {
  it('accepts a comment up to the maximum length', () => {
    expect(
      validateComment({ rawComment: 'x'.repeat(5), maxLength: 5 })
    ).toEqual({ value: 'xxxxx' })
  })

  it.each([
    ['', 'Enter a comment'],
    ['x'.repeat(6), 'The comment must be 5 characters or fewer']
  ])('rejects the comment of %#', (rawComment, message) => {
    expect(validateComment({ rawComment, maxLength: 5 }).error).toBe(message)
  })
})
