import { statusCodes } from '#/server/common/constants/status-codes.js'
import { saveFormState, toErrorList } from './form-state.js'
import { MAX_COMMENT_LENGTH } from './form-validation.js'

/**
 * @param {object} params
 * @param {import('@hapi/hapi').Request} params.request
 * @param {string} params.chargingYear The fixed year, shown on the change form
 * @param {number[]} [params.years] The years the add form's select offers
 * @param {import('./form-state.js').FormState} params.state
 * @param {{ heading: string, backHref: string }} params.page
 */
export function buildFormViewModel({
  request,
  chargingYear,
  years,
  state,
  page
}) {
  const { displayName, email } = request.auth.credentials
  return {
    pageTitle: page.heading,
    heading: page.heading,
    backHref: page.backHref,
    formAction: request.path,
    chargingYear,
    summaryRows: [
      ...(chargingYear
        ? [{ key: { text: 'Charging year' }, value: { text: chargingYear } }]
        : []),
      { key: { text: 'Your name' }, value: { text: displayName } },
      { key: { text: 'Your email' }, value: { text: email } }
    ],
    yearItems: years && [
      { value: '', text: 'Select a year' },
      ...years.map((year) => ({
        value: String(year),
        text: String(year),
        selected: state.values.chargingYear === String(year)
      }))
    ],
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
 * @param {import('./form-validation.js').InflationIndexFormErrors} params.errors
 */
export function redirectToFormWithErrors({ request, h, errors }) {
  saveFormState({ request, state: { values: request.payload, errors } })
  return h.redirect(request.path).code(statusCodes.redirectAfterPost)
}
