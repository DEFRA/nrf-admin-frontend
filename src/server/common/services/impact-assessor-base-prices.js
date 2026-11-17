import { callImpactAssessor } from './impact-assessor.js'

/**
 * @typedef {object} BasePrice
 * @property {number} id
 * @property {number} edpId
 * @property {number} basePrice
 * @property {string} createdAt
 * @property {string} effectiveFrom
 * @property {string} comment
 * @property {string | null} requestor Null on a base price saved before requestors were recorded
 * @property {string | null} jiraTicket Null on a base price saved before tickets were recorded
 * @property {string} staffId
 * @property {string} staffFullName
 * @property {string} staffEmail
 */

/**
 * @typedef {object} EdpBasePrices
 * @property {number} edpId
 * @property {string} edpName
 * @property {BasePrice[]} basePrices Newest effectiveFrom first
 */

/** @returns {Promise<{ edps?: EdpBasePrices[], error?: string, statusCode?: number }>} */
export async function getBasePrices() {
  const { payload, ...failure } = await callImpactAssessor({
    method: 'get',
    path: '/base-prices',
    action: 'Unable to fetch base prices'
  })
  return payload ? { edps: payload } : failure
}

/**
 * @param {object} body Fields for the impact assessor POST /base-prices, in camelCase
 */
export async function addBasePrice(body) {
  const { payload, ...failure } = await callImpactAssessor({
    method: 'post',
    path: '/base-prices',
    body,
    action: 'Unable to add base price'
  })
  return payload ? { basePrice: payload } : failure
}

/**
 * @param {object} params
 * @param {number} params.id
 * @param {object} params.changes Fields for the impact assessor PATCH /base-prices/{id}, in camelCase
 */
export async function updateBasePrice({ id, changes }) {
  const { payload, ...failure } = await callImpactAssessor({
    method: 'patch',
    path: `/base-prices/${id}`,
    body: changes,
    action: 'Unable to change base price'
  })
  return payload ? { basePrice: payload } : failure
}

/** @param {number} id */
export async function deleteBasePrice(id) {
  const { error, ...failure } = await callImpactAssessor({
    method: 'delete',
    path: `/base-prices/${id}`,
    action: 'Unable to delete base price'
  })
  return error ? { error, ...failure } : { deleted: true }
}
