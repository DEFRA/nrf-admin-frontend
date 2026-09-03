import { formatCurrencyPrecise } from './format-currency-precise.js'

describe('#formatCurrencyPrecise', () => {
  describe('With defaults', () => {
    it('should keep up to four decimal places for unrounded values', () => {
      expect(formatCurrencyPrecise('2193.6649')).toBe('£2,193.6649')
    })

    it('should pad values with fewer than two decimal places', () => {
      expect(formatCurrencyPrecise('2193.6')).toBe('£2,193.60')
    })

    it('should leave already rounded values unchanged', () => {
      expect(formatCurrencyPrecise('2193.66')).toBe('£2,193.66')
    })

    it('should format whole numbers to two decimal places', () => {
      expect(formatCurrencyPrecise(999)).toBe('£999.00')
    })
  })

  describe('With currency attributes', () => {
    it('should be in provided format', () => {
      expect(formatCurrencyPrecise('2193.6649', 'en-US', 'USD')).toBe(
        '$2,193.6649'
      )
    })
  })
})
