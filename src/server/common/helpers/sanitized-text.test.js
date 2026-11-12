import { sanitizedText } from './sanitized-text.js'

const validate = (value) => sanitizedText(50).validate(value)

describe('sanitizedText', () => {
  it.each([
    ['<script>alert(1)</script>', 'scriptalert(1)/script'],
    ['<img src=x onerror=alert(1)>', 'img src=x onerror=alert(1)'],
    ['  Advised by NE  ', 'Advised by NE'],
    ['Price rose by 5 & 10 percent', 'Price rose by 5 & 10 percent'],
    ['<>', '']
  ])('turns %s into %s', (input, expected) => {
    expect(validate(input).value).toBe(expected)
  })

  it('defaults a missing value to an empty string', () => {
    expect(validate(undefined).value).toBe('')
  })

  it('rejects input longer than the maximum', () => {
    expect(validate('x'.repeat(51)).error).toBeDefined()
  })
})
