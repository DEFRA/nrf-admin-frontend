/**
 * @param {object} params
 * @param {string} params.rawRequestor
 * @param {number} params.maxLength
 * @returns {{ value?: string, error?: string }}
 */
export function validateRequestor({ rawRequestor, maxLength }) {
  if (!rawRequestor) {
    return { error: 'Enter the name of the person who requested the change' }
  }
  if (rawRequestor.length > maxLength) {
    return {
      error: `The requestor name must be ${maxLength} characters or fewer`
    }
  }
  return { value: rawRequestor }
}
