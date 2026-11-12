import Boom from '@hapi/boom'

import {
  emptyUkDateTimeFormValues,
  ukDateTimeFormValues
} from '#/server/common/helpers/uk-date-time-form-values.js'
import { getBasePrices } from '#/server/common/services/impact-assessor-base-prices.js'
import { DEFAULT_EDP_ID } from './constants.js'

const flashKey = (request) => `basePriceForm:${request.path}`
const TWO_DIGITS = 2

const fieldIds = {
  basePrice: 'basePrice',
  effectiveFrom: 'effectiveFrom-day',
  effectiveFromTime: 'effectiveFromTime',
  comment: 'comment'
}

/**
 * @typedef {import('#/server/common/services/impact-assessor-base-prices.js').BasePrice} BasePrice
 * @typedef {import('#/server/common/services/impact-assessor-base-prices.js').EdpBasePrices} EdpBasePrices
 * @typedef {import('./form-validation.js').BasePriceFormErrors} BasePriceFormErrors
 * @typedef {{ values: Record<string, string>, errors: BasePriceFormErrors }} FormState
 */

const EFFECTIVE_FROM_PREFIX = 'effectiveFrom'

/** @returns {Record<string, string>} A blank add form, with the time at the start of the day */
export const emptyFormValues = () => ({
  basePrice: '',
  ...emptyUkDateTimeFormValues(EFFECTIVE_FROM_PREFIX),
  comment: ''
})

/**
 * @param {BasePrice} basePrice
 * @returns {Record<string, string>} The change form's values for a saved price, in UK local time
 */
export const formValuesFor = (basePrice) => ({
  basePrice: basePrice.basePrice.toFixed(TWO_DIGITS),
  ...ukDateTimeFormValues({
    prefix: EFFECTIVE_FROM_PREFIX,
    utc: basePrice.effectiveFrom
  }),
  comment: basePrice.comment
})

/**
 * Keeps a rejected submission for the redirect back to the form it came from.
 * Keyed by the form's path, so one form never shows another's rejected values.
 *
 * @param {{ request: import('@hapi/hapi').Request, state: FormState }} params
 */
export const saveFormState = ({ request, state }) =>
  request.yar.flash(flashKey(request), state)

/**
 * @param {{ request: import('@hapi/hapi').Request, defaultValues: Record<string, string> }} params defaultValues is used when no submission was rejected
 * @returns {FormState}
 */
export const takeFormState = ({ request, defaultValues }) =>
  request.yar.flash(flashKey(request))?.at(0) ?? {
    values: defaultValues,
    errors: {}
  }

/**
 * @param {BasePriceFormErrors} errors
 * @returns {{ text: string, href: string }[]}
 */
export const toErrorList = (errors) =>
  Object.entries(errors).map(([field, text]) => ({
    text,
    href: `#${fieldIds[field]}`
  }))

/**
 * @param {number} basePriceId
 * @returns {Promise<{ edp: EdpBasePrices, basePrice: BasePrice }>}
 */
export async function loadBasePrice(basePriceId) {
  const edp = await loadDefaultEdp()
  const basePrice = edp.basePrices.find(({ id }) => id === basePriceId)
  if (!basePrice) {
    throw Boom.notFound('Base price not found', {
      message: `No base price found with id ${basePriceId}`
    })
  }
  return { edp, basePrice }
}

/** @returns {Promise<EdpBasePrices>} The default EDP with its base prices */
export async function loadDefaultEdp() {
  const result = await getBasePrices()
  if (result.error) {
    throw Boom.badGateway('Could not load base prices', {
      message: 'Base prices could not be loaded. Check the logs for details.'
    })
  }
  const edp = result.edps.find(({ edpId }) => edpId === DEFAULT_EDP_ID)
  if (!edp) {
    throw Boom.notFound('EDP not found', {
      message: `No EDP found with id ${DEFAULT_EDP_ID}`
    })
  }
  return edp
}

/**
 * @param {{ basePrice: Pick<BasePrice, 'effectiveFrom'>, now: Date }} params
 * @returns {boolean} true when the base price has not taken effect yet
 */
export const isFuture = ({ basePrice, now }) =>
  new Date(basePrice.effectiveFrom) > now
