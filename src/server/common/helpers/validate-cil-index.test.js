import { describe, expect, it } from 'vitest'

import { validateCilIndex } from './validate-cil-index.js'

describe('validateCilIndex', () => {
  it('accepts a whole-number index', () => {
    expect(validateCilIndex({ rawCilIndex: '400' })).toEqual({ value: 400 })
  })

  it('accepts an index with up to 4 decimal places', () => {
    expect(validateCilIndex({ rawCilIndex: '384.21' })).toEqual({
      value: 384.21
    })
    expect(validateCilIndex({ rawCilIndex: '384.2131' })).toEqual({
      value: 384.2131
    })
  })

  it('rejects an empty value', () => {
    expect(validateCilIndex({ rawCilIndex: '' })).toEqual({
      error: 'Enter the RICS CIL Index'
    })
  })

  it('rejects zero and negative values', () => {
    expect(validateCilIndex({ rawCilIndex: '0' }).error).toContain(
      'Enter a valid RICS CIL Index'
    )
    expect(validateCilIndex({ rawCilIndex: '-5' }).error).toBeDefined()
  })

  it('rejects more than 4 decimal places', () => {
    expect(validateCilIndex({ rawCilIndex: '384.21315' }).error).toContain(
      'no more than 4 decimal places'
    )
  })

  it('rejects anything that is not a plain number', () => {
    for (const rawCilIndex of ['abc', '£384', '384,21', '384.2.1', ' ']) {
      expect(validateCilIndex({ rawCilIndex }).error).toBeDefined()
    }
  })
})
