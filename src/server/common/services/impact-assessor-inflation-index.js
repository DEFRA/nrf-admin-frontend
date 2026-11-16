import { callImpactAssessor } from './impact-assessor.js'

/**
 * @typedef {object} InflationIndex
 * @property {string} id
 * @property {number} chargingYear
 * @property {number} cilIndex
 * @property {number} indexFactor
 * @property {string} effectiveFrom 1 January 00:00 UTC of chargingYear
 * @property {string} createdAt
 * @property {string} comment
 * @property {string | null} requestor Null on an index saved before requestors were recorded
 * @property {string | null} jiraTicket Null on an index saved before tickets were recorded
 * @property {string} staffId
 * @property {string} staffFullName
 * @property {string} staffEmail
 */

/** @returns {Promise<{ inflationIndexes?: InflationIndex[], error?: string, statusCode?: number, detail?: string }>} */
export async function getInflationIndexes() {
  const { payload, ...failure } = await callImpactAssessor({
    method: 'get',
    path: '/inflation-indexes',
    action: 'Unable to fetch inflation indexes'
  })
  return payload ? { inflationIndexes: payload } : failure
}

/**
 * @param {object} body Fields for the impact assessor POST /inflation-indexes, in camelCase
 */
export async function addInflationIndex(body) {
  const { payload, ...failure } = await callImpactAssessor({
    method: 'post',
    path: '/inflation-indexes',
    body,
    action: 'Unable to add inflation index'
  })
  return payload ? { inflationIndex: payload } : failure
}

/**
 * @param {object} params
 * @param {string} params.id
 * @param {object} params.changes Fields for the impact assessor PATCH /inflation-indexes/{id}, in camelCase
 */
export async function updateInflationIndex({ id, changes }) {
  const { payload, ...failure } = await callImpactAssessor({
    method: 'patch',
    path: `/inflation-indexes/${id}`,
    body: changes,
    action: 'Unable to change inflation index'
  })
  return payload ? { inflationIndex: payload } : failure
}

/** @param {string} id */
export async function deleteInflationIndex(id) {
  const { error, ...failure } = await callImpactAssessor({
    method: 'delete',
    path: `/inflation-indexes/${id}`,
    action: 'Unable to delete inflation index'
  })
  return error ? { error, ...failure } : { deleted: true }
}
