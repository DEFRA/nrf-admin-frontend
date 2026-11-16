import { describe, expect, it } from 'vitest'

import { validateInflationIndexForm } from './form-validation.js'

const now = new Date('2026-11-12T10:00:00Z')

describe('validateInflationIndexForm', () => {
  describe('the add form', () => {
    const validate = (payload) =>
      validateInflationIndexForm({ payload, now }, { requireYear: true })

    it('accepts a future year, an index, a requestor, a ticket and a comment', () => {
      expect(
        validate({
          chargingYear: '2028',
          cilIndex: '384.21',
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: 'NE advice'
        })
      ).toEqual({
        errors: {},
        value: {
          chargingYear: 2028,
          cilIndex: 384.21,
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: 'NE advice'
        }
      })
    })

    it('rejects a missing year', () => {
      expect(
        validate({
          chargingYear: '',
          cilIndex: '384.21',
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: 'NE advice'
        }).errors.chargingYear
      ).toBe('Select the year the inflation index applies to')
    })

    it('rejects the current year and years already begun', () => {
      expect(
        validate({ chargingYear: '2026', requestor: 'x', jiraTicket: 'NRF2-1' })
          .errors.chargingYear
      ).toContain('Select the year')
    })

    it('rejects a non-numeric year', () => {
      expect(
        validate({ chargingYear: 'abcd', requestor: 'x', jiraTicket: 'NRF2-1' })
          .errors.chargingYear
      ).toContain('Select the year')
    })
  })

  describe('the change form', () => {
    const validate = (payload) => validateInflationIndexForm({ payload, now })

    it('checks the index, requestor, ticket and comment without the year', () => {
      expect(
        validate({
          cilIndex: '390.5',
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: 'Revised'
        })
      ).toEqual({
        errors: {},
        value: {
          cilIndex: 390.5,
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: 'Revised'
        }
      })
    })

    it('rejects a missing index', () => {
      expect(
        validate({
          cilIndex: '',
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: 'Revised'
        }).errors.cilIndex
      ).toBe('Enter the RICS CIL Index')
    })

    it('rejects an invalid index', () => {
      expect(
        validate({
          cilIndex: '384.21315',
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: 'Revised'
        }).errors.cilIndex
      ).toContain('Enter a valid RICS CIL Index')
      expect(
        validate({
          cilIndex: '0',
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: 'Revised'
        }).errors.cilIndex
      ).toContain('Enter a valid RICS CIL Index')
    })

    it('rejects a missing requestor against the requestor field', () => {
      expect(
        validate({ cilIndex: '384.21', requestor: '', jiraTicket: 'NRF2-1234' })
          .errors.requestor
      ).toBe('Enter the name of the person who requested the change')
    })

    it('rejects a requestor that is too long against the requestor field', () => {
      expect(
        validate({
          cilIndex: '384.21',
          requestor: 'x'.repeat(256),
          jiraTicket: 'NRF2-1234'
        }).errors.requestor
      ).toBe('The requestor name must be 255 characters or fewer')
    })

    it.each([[''], ['1234'], ['NRF-1234']])(
      'rejects the Jira ticket "%s" against the Jira ticket field',
      (jiraTicket) => {
        expect(
          Object.keys(
            validate({
              cilIndex: '384.21',
              requestor: 'x',
              jiraTicket,
              comment: 'Revised'
            }).errors
          )
        ).toEqual(['jiraTicket'])
      }
    )

    it('saves the Jira ticket in upper case', () => {
      expect(
        validate({
          cilIndex: '384.21',
          requestor: 'x',
          jiraTicket: 'nrf2-77',
          comment: 'Revised'
        }).value.jiraTicket
      ).toBe('NRF2-77')
    })

    it('rejects a missing comment against the comment field', () => {
      expect(
        validate({
          cilIndex: '384.21',
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: ''
        }).errors.comment
      ).toBe('Enter a comment')
    })

    it('rejects a comment over the limit', () => {
      expect(
        validate({
          cilIndex: '384.21',
          requestor: 'Grace Hopper',
          jiraTicket: 'NRF2-1234',
          comment: 'x'.repeat(501)
        }).errors.comment
      ).toContain('500 characters or fewer')
    })

    it('reports every problem at once', () => {
      expect(
        validate({
          chargingYear: '',
          cilIndex: '',
          requestor: '',
          jiraTicket: '',
          comment: ''
        }).errors
      ).toEqual({
        cilIndex: 'Enter the RICS CIL Index',
        requestor: 'Enter the name of the person who requested the change',
        jiraTicket: 'Enter the Jira ticket reference',
        comment: 'Enter a comment'
      })
    })
  })
})
