/**
 * Wraps the real config for `vi.mock('#/config/config.js')` so a test file
 * runs as production with an approved delete-eligibility address list — the
 * quote fixtures' emails are approved, the ineligible fixture's external
 * address is not. Use inside the mock factory:
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
 * @returns {object} config with production + patterns overlaid
 */
export const productionDeleteEligibilityConfig = (config) => ({
  config: {
    get: (key) =>
      key === 'isProduction'
        ? true
        : key === 'quoteDelete.eligibleEmailPatterns'
          ? ['developer@housebuilder.com', 'another@developer.com']
          : config.get(key)
  }
})
