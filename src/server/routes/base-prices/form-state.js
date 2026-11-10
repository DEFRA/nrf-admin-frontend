import Boom from '@hapi/boom'

import { utcToUkLocal } from '#/server/common/helpers/uk-local-time.js'
import { getBasePrices } from '#/server/common/services/impact-assessor-base-prices.js'
import { DEFAULT_EDP_ID } from './constants.js'

const FLASH_KEY = 'basePriceForm'
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

const pad = (number) => String(number).padStart(TWO_DIGITS, '0')

/** @returns {Record<string, string>} A blank add form, with the time at the start of the day */
export const emptyFormValues = () => ({
  basePrice: '',
  'effectiveFrom-day': '',
  'effectiveFrom-month': '',
  'effectiveFrom-year': '',
  effectiveFromTime: '00:00',
  comment: ''
})

/**
 * @param {BasePrice} basePrice
 * @returns {Record<string, string>} The change form's values for a saved price, in UK local time
 */
export function formValuesFor(basePrice) {
  const { year, month, day, hour, minute } = utcToUkLocal(
    basePrice.effectiveFrom
  )
  return {
    basePrice: basePrice.basePrice.toFixed(TWO_DIGITS),
    'effectiveFrom-day': String(day),
    'effectiveFrom-month': String(month),
    'effectiveFrom-year': String(year),
    effectiveFromTime: `${pad(hour)}:${pad(minute)}`,
    comment: basePrice.comment
  }
}

/**
 * Keeps a rejected submission for the redirect back to the form.
 *
 * @param {{ request: import('@hapi/hapi').Request, state: FormState }} params
 */
export const saveFormState = ({ request, state }) =>
  request.yar.flash(FLASH_KEY, state)

/**
 * @param {{ request: import('@hapi/hapi').Request, defaultValues: Record<string, string> }} params defaultValues is used when no submission was rejected
 * @returns {FormState}
 */
export const takeFormState = ({ request, defaultValues }) =>
  request.yar.flash(FLASH_KEY)?.at(0) ?? { values: defaultValues, errors: {} }

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
 * @returns {Promise<{ edp: EdpBasePrices, basePrice: BasePrice | undefined }>}
 */
export async function loadBasePrice(basePriceId) {
  const edp = await loadDefaultEdp()
  return {
    edp,
    basePrice: edp.basePrices.find(({ id }) => id === basePriceId)
  }
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
