const MAX_PRICE_PATTERN = /^\d{1,8}(\.\d{1,2})?$/
const THOUSANDS_SEPARATED_PATTERN = /^\d{1,3}(,\d{3})+(\.\d{1,2})?$/

/**
 * Checks a price typed into a form: more than £0, under £100,000,000, at most
 * 2 decimal places. A leading £ and correctly placed thousands commas are allowed.
 *
 * @param {object} params
 * @param {string} params.rawPrice
 * @param {string} params.label What the price is called in error messages, e.g. "base price"
 * @returns {{ value?: number, error?: string }}
 */
export function validatePrice({ rawPrice, label }) {
  if (!rawPrice) {
    return { error: `Enter the ${label}` }
  }
  const entered = rawPrice.replace(/^£/, '')
  const amount = THOUSANDS_SEPARATED_PATTERN.test(entered)
    ? entered.replaceAll(',', '')
    : entered
  if (!MAX_PRICE_PATTERN.test(amount) || Number(amount) <= 0) {
    return {
      error: `Enter a valid ${label}, like 2675 or 2675.50. It must be more than £0, under £100,000,000 and have no more than 2 decimal places`
    }
  }
  return { value: Number(amount) }
}
