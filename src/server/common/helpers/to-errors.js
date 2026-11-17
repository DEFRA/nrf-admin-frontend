/**
 * Turns per-field validator results into a form's errors object: one message
 * per field that failed, dropping the fields that passed.
 *
 * @param {Record<string, { error?: string }>} validations Field name to its validator's result
 * @returns {Record<string, string>}
 */
export const toErrors = (validations) =>
  Object.fromEntries(
    Object.entries(validations)
      .filter(([, { error }]) => error)
      .map(([fieldName, { error }]) => [fieldName, error])
  )
