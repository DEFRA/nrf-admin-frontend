/**
 * A form's rejected submission, kept in the flash for the redirect back to
 * the form it came from. Keyed by the form's path under a per-feature
 * prefix, so one form never shows another's rejected values.
 */

const flashKey = (prefix, request) => `${prefix}:${request.path}`

/**
 * @param {object} params
 * @param {string} params.prefix The feature's flash-key prefix, like 'inflationIndexForm'
 * @param {import('@hapi/hapi').Request} params.request
 * @param {{ values: Record<string, string>, errors: Record<string, string> }} params.state
 */
export const saveFlashFormState = ({ prefix, request, state }) =>
  request.yar.flash(flashKey(prefix, request), state)

/**
 * @param {object} params
 * @param {string} params.prefix The feature's flash-key prefix, like 'inflationIndexForm'
 * @param {import('@hapi/hapi').Request} params.request
 * @param {Record<string, string>} params.defaultValues Used when no submission was rejected
 * @returns {{ values: Record<string, string>, errors: Record<string, string> }}
 */
export const takeFlashFormState = ({ prefix, request, defaultValues }) =>
  request.yar.flash(flashKey(prefix, request))?.at(0) ?? {
    values: defaultValues,
    errors: {}
  }
