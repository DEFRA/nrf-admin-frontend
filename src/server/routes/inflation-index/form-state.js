import Boom from '@hapi/boom'

import { getInflationIndexes } from '#/server/common/services/impact-assessor-inflation-index.js'
import { YEAR_OPTIONS } from './constants.js'

const FLASH_KEY = 'inflationIndexForm'

const fieldIds = {
  chargingYear: 'chargingYear',
  cilIndex: 'cilIndex',
  comment: 'comment'
}

/**
 * @typedef {import('#/server/common/services/impact-assessor-inflation-index.js').InflationIndex} InflationIndex
 * @typedef {import('./form-validation.js').InflationIndexFormErrors} InflationIndexFormErrors
 * @typedef {{ values: Record<string, string>, errors: InflationIndexFormErrors }} FormState
 */

/** @returns {Record<string, string>} A blank add form */
export const emptyFormValues = () => ({
  chargingYear: '',
  cilIndex: '',
  comment: ''
})

/**
 * @param {InflationIndex} inflationIndex
 * @returns {Record<string, string>} The change form's values for a saved index
 */
export const formValuesFor = (inflationIndex) => ({
  chargingYear: String(inflationIndex.chargingYear),
  cilIndex: String(inflationIndex.cilIndex),
  comment: inflationIndex.comment
})

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
 * @param {InflationIndexFormErrors} errors
 * @returns {{ text: string, href: string }[]}
 */
export const toErrorList = (errors) =>
  Object.entries(errors).map(([field, text]) => ({
    text,
    href: `#${fieldIds[field]}`
  }))

/** @returns {Promise<InflationIndex[]>} Every saved index, newest year first */
export async function loadInflationIndexes() {
  const result = await getInflationIndexes()
  if (result.error) {
    throw Boom.badGateway('Could not load inflation indexes', {
      message: 'Inflation indexes could not be loaded. Check the logs.'
    })
  }
  return result.inflationIndexes
}

/**
 * @param {string} id
 * @returns {Promise<InflationIndex>} The index with the id
 */
export async function loadInflationIndex(id) {
  const inflationIndex = (await loadInflationIndexes()).find(
    ({ id: indexId }) => indexId === id
  )
  if (!inflationIndex) {
    throw Boom.notFound('Inflation index not found', {
      message: `No inflation index found with id ${id}`
    })
  }
  return inflationIndex
}

/**
 * @param {{ inflationIndex: Pick<InflationIndex, 'effectiveFrom'>, now: Date }} params
 * @returns {boolean} true when the index's charging year has not begun yet
 */
export const isFuture = ({ inflationIndex, now }) =>
  new Date(inflationIndex.effectiveFrom) > now

/**
 * The charging years the add form can offer: the next YEAR_OPTIONS years that
 * have not begun, minus the years that already have an index.
 *
 * @param {{ inflationIndexes: Pick<InflationIndex, 'chargingYear'>[], now: Date }} params
 * @returns {number[]}
 */
export const availableYears = ({ inflationIndexes, now }) => {
  const taken = new Set(
    inflationIndexes.map(({ chargingYear }) => chargingYear)
  )
  const firstYear = now.getUTCFullYear() + 1
  return Array.from(
    { length: YEAR_OPTIONS },
    (_, offset) => firstYear + offset
  ).filter((year) => !taken.has(year))
}
