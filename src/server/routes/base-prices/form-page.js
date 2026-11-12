import { statusCodes } from '#/server/common/constants/status-codes.js'
import { saveFormState, toErrorList } from './form-state.js'
import { MAX_COMMENT_LENGTH } from './form-validation.js'

/**
 * @param {object} params
 * @param {import('@hapi/hapi').Request} params.request
 * @param {string} params.edpName
 * @param {import('./form-state.js').FormState} params.state
 * @param {{ heading: string, backHref: string }} params.page
 */
export function buildFormViewModel({ request, edpName, state, page }) {
  const { displayName, email } = request.auth.credentials
  return {
    pageTitle: page.heading,
    heading: page.heading,
    backHref: page.backHref,
    formAction: request.path,
    edpName,
    staffName: displayName,
    staffEmail: email,
    maxCommentLength: MAX_COMMENT_LENGTH,
    values: state.values,
    errors: state.errors,
    errorList: toErrorList(state.errors)
  }
}

/**
 * Sends a rejected submission back to the form it came from (POST-redirect-GET).
 *
 * @param {object} params
 * @param {import('@hapi/hapi').Request} params.request
 * @param {import('@hapi/hapi').ResponseToolkit} params.h
 * @param {import('./form-validation.js').BasePriceFormErrors} params.errors
 */
export function redirectToFormWithErrors({ request, h, errors }) {
  saveFormState({ request, state: { values: request.payload, errors } })
  return h.redirect(request.path).code(statusCodes.redirectAfterPost)
}
