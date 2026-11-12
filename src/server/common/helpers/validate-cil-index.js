const CIL_INDEX_PATTERN = /^\d{1,6}(\.\d{1,4})?$/

/**
 * Checks a RICS CIL Index typed into a form: more than 0, at most 4 decimal
 * places. The published index is a plain number, so no currency symbol or
 * thousands separators are allowed.
 *
 * @param {object} params
 * @param {string} params.rawCilIndex
 * @returns {{ value?: number, error?: string }}
 */
export function validateCilIndex({ rawCilIndex }) {
  if (!rawCilIndex) {
    return { error: 'Enter the RICS CIL Index' }
  }
  if (!CIL_INDEX_PATTERN.test(rawCilIndex) || Number(rawCilIndex) <= 0) {
    return {
      error:
        'Enter a valid RICS CIL Index, like 384.21. It must be more than 0 and have no more than 4 decimal places'
    }
  }
  return { value: Number(rawCilIndex) }
}
