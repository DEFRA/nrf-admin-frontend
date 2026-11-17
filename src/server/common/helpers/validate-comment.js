/** The longest comment a form accepts, shared by every form that has one. */
export const MAX_COMMENT_LENGTH = 500

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
