/**
 * @param {object} params
 * @param {string} params.rawComment
 * @param {number} params.maxLength
 * @returns {{ value?: string, error?: string }}
 */
export function validateComment({ rawComment, maxLength }) {
  if (!rawComment) {
    return { error: 'Enter a comment' }
  }
  if (rawComment.length > maxLength) {
    return { error: `The comment must be ${maxLength} characters or fewer` }
  }
  return { value: rawComment }
}
