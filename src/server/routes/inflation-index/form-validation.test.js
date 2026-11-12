import { describe, expect, it } from 'vitest'

import { validateInflationIndexForm } from './form-validation.js'

const now = new Date('2026-11-12T10:00:00Z')

describe('validateInflationIndexForm', () => {
  describe('the add form', () => {
    const validate = (payload) =>
      validateInflationIndexForm({ payload, now }, { requireYear: true })

    it('accepts a future year, an index and a comment', () => {
      expect(
        validate({
          chargingYear: '2028',
          cilIndex: '384.21',
          comment: 'NE advice'
        })
      ).toEqual({
        errors: {},
        value: { chargingYear: 2028, cilIndex: 384.21, comment: 'NE advice' }
      })
    })

    it('rejects a missing year', () => {
      expect(
        validate({ chargingYear: '', cilIndex: '384.21', comment: 'NE advice' })
          .errors.chargingYear
      ).toBe('Select the year the inflation index applies to')
    })

    it('rejects the current year and years already begun', () => {
      expect(validate({ chargingYear: '2026' }).errors.chargingYear).toContain(
        'Select the year'
      )
    })

    it('rejects a non-numeric year', () => {
      expect(validate({ chargingYear: 'abcd' }).errors.chargingYear).toContain(
        'Select the year'
      )
    })
  })

  describe('the change form', () => {
    const validate = (payload) => validateInflationIndexForm({ payload, now })

    it('checks the index and comment without the year', () => {
      expect(validate({ cilIndex: '390.5', comment: 'Revised' })).toEqual({
        errors: {},
        value: { cilIndex: 390.5, comment: 'Revised' }
      })
    })

    it('rejects a missing index', () => {
      expect(
        validate({ cilIndex: '', comment: 'Revised' }).errors.cilIndex
      ).toBe('Enter the RICS CIL Index')
    })

    it('rejects an invalid index', () => {
      expect(
        validate({ cilIndex: '384.21315', comment: 'Revised' }).errors.cilIndex
      ).toContain('Enter a valid RICS CIL Index')
      expect(
        validate({ cilIndex: '0', comment: 'Revised' }).errors.cilIndex
      ).toContain('Enter a valid RICS CIL Index')
    })

    it('rejects a missing comment', () => {
      expect(validate({ cilIndex: '384.21', comment: '' }).errors.comment).toBe(
        'Enter a comment'
      )
    })

    it('rejects a comment over the limit', () => {
      expect(
        validate({ cilIndex: '384.21', comment: 'x'.repeat(501) }).errors
          .comment
      ).toContain('500 characters or fewer')
    })
  })
})
