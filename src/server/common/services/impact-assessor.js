import Wreck from '@hapi/wreck'
import { buildServiceHeaders, wreckErrorContext } from '@defra/nrf-library'

import { config } from '#/config/config.js'
import { createLogger } from '../helpers/logging/logger.js'

const logger = createLogger()

const API_URL_KEY = 'impactAssessor.apiUrl'

const parseBody = (payload) => {
  if (!payload) {
    return undefined
  }
  if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
    return payload
  }
  try {
    return JSON.parse(payload.toString())
  } catch {
    return undefined
  }
}

// Wreck hangs the upstream body off `error.data.payload`. FastAPI reports
// failures under `detail`: a string, or a list of per-field errors.
const upstreamDetail = (error) => {
  const { detail } = parseBody(error?.data?.payload) ?? {}
  if (typeof detail === 'string') {
    return detail
  }
  if (Array.isArray(detail)) {
    return (
      detail
        .map((d) => d?.msg)
        .filter(Boolean)
        .join('; ') || undefined
    )
  }
  return undefined
}

const dataSyncHeaders = () =>
  buildServiceHeaders({
    traceHeaderName: config.get('tracing.header'),
    serviceKey: config.get('impactAssessor.dataSyncToken'),
    serviceKeyHeaderName: 'x-data-sync-token'
  })

export async function triggerDataSync({ force = false, manifest } = {}) {
  const baseUrl = config.get(API_URL_KEY)
  const url = `${baseUrl}/admin/data-sync?force=${force ? 'true' : 'false'}`

  const tableNames = Object.keys(manifest?.tables ?? {}).join(',')

  logger.info(
    `Triggering data sync - url: ${url}, force: ${force}, tables: ${tableNames}`
  )

  try {
    const { payload } = await Wreck.post(url, {
      payload: JSON.stringify(manifest),
      json: true,
      headers: {
        ...dataSyncHeaders(),
        'Content-Type': 'application/json'
      }
    })
    return { runId: payload.run_id, status: payload.status }
  } catch (error) {
    const { statusCode } = wreckErrorContext(error)
    logger.error(
      error,
      `Error triggering data sync - url: ${url}, statusCode: ${statusCode}`
    )
    return {
      error: 'Unable to trigger data sync',
      statusCode,
      detail: upstreamDetail(error)
    }
  }
}

export async function rollbackDataSync({ tables } = {}) {
  const baseUrl = config.get(API_URL_KEY)
  const url = `${baseUrl}/admin/data-sync/rollback`

  logger.info(
    `Triggering data sync rollback - url: ${url}, tables: ${tables?.join(',') ?? 'default (last load)'}`
  )

  try {
    const { payload } = await Wreck.post(url, {
      payload: JSON.stringify(tables ? { tables } : {}),
      json: true,
      headers: {
        ...dataSyncHeaders(),
        'Content-Type': 'application/json'
      }
    })
    return { rolledBack: payload.rolled_back, skipped: payload.skipped }
  } catch (error) {
    const { statusCode } = wreckErrorContext(error)
    logger.error(
      error,
      `Error triggering data sync rollback - url: ${url}, statusCode: ${statusCode}`
    )
    return {
      error: 'Unable to roll back data sync',
      statusCode,
      detail: upstreamDetail(error)
    }
  }
}

export async function getDataSyncStatus(runId) {
  const baseUrl = config.get(API_URL_KEY)
  const url = `${baseUrl}/admin/data-sync/${runId}`

  logger.info(`Fetching data sync status - url: ${url}, runId: ${runId}`)

  try {
    const { payload } = await Wreck.get(url, {
      json: true,
      headers: dataSyncHeaders()
    })
    return payload
  } catch (error) {
    const { statusCode } = wreckErrorContext(error)
    logger.error(
      error,
      `Error fetching data sync status - url: ${url}, runId: ${runId}, statusCode: ${statusCode}`
    )
    // A failed run's payload carries its own `error` field, so signal
    // transport failures under a distinct key.
    return { serviceError: 'Unable to fetch data sync status', statusCode }
  }
}

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
async function callBasePrices({ method, path, body, action }) {
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
 * @typedef {object} BasePrice
 * @property {number} id
 * @property {number} edpId
 * @property {number} basePrice
 * @property {string} createdAt
 * @property {string} effectiveFrom
 * @property {string} comment
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
  const { payload, ...failure } = await callBasePrices({
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
  const { payload, ...failure } = await callBasePrices({
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
  const { payload, ...failure } = await callBasePrices({
    method: 'patch',
    path: `/base-prices/${id}`,
    body: changes,
    action: 'Unable to change base price'
  })
  return payload ? { basePrice: payload } : failure
}

/** @param {number} id */
export async function deleteBasePrice(id) {
  const { error, ...failure } = await callBasePrices({
    method: 'delete',
    path: `/base-prices/${id}`,
    action: 'Unable to delete base price'
  })
  return error ? { error, ...failure } : { deleted: true }
}
