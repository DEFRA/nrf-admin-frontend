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
