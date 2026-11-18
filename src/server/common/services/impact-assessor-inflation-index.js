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

/**
 * @typedef {object} InflationIndexHistoryEntry One recorded change: added, amended or deleted
 * @property {string} id
 * @property {string} inflationIndexId The index the change was about, which may since have been deleted
 * @property {number} chargingYear
 * @property {number} cilIndex
 * @property {number} indexFactor
 * @property {'added' | 'amended' | 'deleted'} action
 * @property {string} comment
 * @property {string | null} requestor
 * @property {string | null} jiraTicket
 * @property {string} staffId
 * @property {string} staffFullName
 * @property {string} staffEmail
 * @property {string} createdAt When the change was saved
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

/** @returns {Promise<{ history?: InflationIndexHistoryEntry[], error?: string, statusCode?: number, detail?: string }>} */
export async function getInflationIndexHistory() {
  const { payload, ...failure } = await callImpactAssessor({
    method: 'get',
    path: '/inflation-indexes/history',
    action: 'Unable to fetch the inflation index change history'
  })
  return payload ? { history: payload } : failure
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

/**
 * Deletes an index, sending who is deleting it and their comment so the
 * deletion is recorded in the change history.
 *
 * @param {object} params
 * @param {string} params.id
 * @param {string} params.comment Why the index is being deleted
 * @param {string} params.staffId
 * @param {string} params.staffFullName
 * @param {string} params.staffEmail
 */
export async function deleteInflationIndex({
  id,
  comment,
  staffId,
  staffFullName,
  staffEmail
}) {
  const { error, ...failure } = await callImpactAssessor({
    method: 'delete',
    path: `/inflation-indexes/${id}`,
    body: { comment, staffId, staffFullName, staffEmail },
    action: 'Unable to delete inflation index'
  })
  return error ? { error, ...failure } : { deleted: true }
}
