/**
 * Wraps the real config for `vi.mock('#/config/config.js')` so a test file
 * runs as the prod CDP environment with an approved delete-eligibility
 * address list — the quote fixtures' emails are approved, the ineligible
 * fixture's external address is not. Use inside the mock factory:
 *
 * vi.mock('#/config/config.js', async (importOriginal) => {
 *   const { config } = await importOriginal()
 *   const { productionDeleteEligibilityConfig } = await import(
 *     '#/test-utils/production-delete-eligibility.js'
 *   )
 *   return productionDeleteEligibilityConfig(config)
 * })
 *
 * The lazy import keeps the factory free of outer references, which vitest
 * hoists above.
 *
 * @param {import('#/config/config.js').config} config - the real config
 * @returns {object} config with prod environment + patterns overlaid
 */
export const productionDeleteEligibilityConfig = (config) => ({
  config: {
    get: (key) => {
      if (key === 'cdpEnvironment') {
        return 'prod'
      }
      if (key === 'quoteDelete.eligibleEmailPatterns') {
        return ['developer@housebuilder.com', 'another@developer.com']
      }
      return config.get(key)
    }
  }
})
