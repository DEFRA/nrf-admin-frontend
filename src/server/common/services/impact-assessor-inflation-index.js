import Wreck from '@hapi/wreck'
import { buildServiceHeaders, wreckErrorContext } from '@defra/nrf-library'

import { config } from '#/config/config.js'
import { createLogger } from '../helpers/logging/logger.js'
import { upstreamDetail } from './impact-assessor.js'

const logger = createLogger()

const API_URL_KEY = 'impactAssessor.apiUrl'

const apiKeyHeaders = () =>
  buildServiceHeaders({
    traceHeaderName: config.get('tracing.header'),
    serviceKey: config.get('impactAssessor.apiKey')
  })

/**
 * @param {object} params
 * @param {'get' | 'post' | 'patch' | 'delete'} params.method
 * @param {string} params.path
 * @param {object} [params.body]
 * @param {string} params.action Describes the call in log messages
 * @returns {Promise<{ payload?: any, error?: string, statusCode?: number, detail?: string }>}
 */
async function callInflationIndexes({ method, path, body, action }) {
  const url = `${config.get(API_URL_KEY)}${path}`
  logger.info({ url, method }, `${action} - calling impact assessor`)

  try {
    const { payload } = await Wreck[method](url, {
      json: true,
      headers: {
        ...apiKeyHeaders(),
        ...(body && { 'Content-Type': 'application/json' })
      },
      ...(body && { payload: JSON.stringify(body) })
    })
    return { payload }
  } catch (error) {
    const { statusCode } = wreckErrorContext(error)
    logger.error(
      error,
      `${action} failed - url: ${url}, statusCode: ${statusCode}`
    )
    return { error: action, statusCode, detail: upstreamDetail(error) }
  }
}

/**
 * @typedef {object} InflationIndex
 * @property {string} id
 * @property {number} chargingYear
 * @property {number} cilIndex
 * @property {number} indexFactor
 * @property {string} effectiveFrom 1 January 00:00 UTC of chargingYear
 * @property {string} createdAt
 * @property {string} comment
 * @property {string} staffId
 * @property {string} staffFullName
 * @property {string} staffEmail
 */

/** @returns {Promise<{ inflationIndexes?: InflationIndex[], error?: string, statusCode?: number, detail?: string }>} */
export async function getInflationIndexes() {
  const { payload, ...failure } = await callInflationIndexes({
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
  const { payload, ...failure } = await callInflationIndexes({
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
  const { payload, ...failure } = await callInflationIndexes({
    method: 'patch',
    path: `/inflation-indexes/${id}`,
    body: changes,
    action: 'Unable to change inflation index'
  })
  return payload ? { inflationIndex: payload } : failure
}

/** @param {string} id */
export async function deleteInflationIndex(id) {
  const { error, ...failure } = await callInflationIndexes({
    method: 'delete',
    path: `/inflation-indexes/${id}`,
    action: 'Unable to delete inflation index'
  })
  return error ? { error, ...failure } : { deleted: true }
}
