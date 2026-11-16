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
// failures under `detail`: a string, a list of per-field errors, or an object
// with a machine-readable `error` code and a human `message`.
export const upstreamDetail = (error) => {
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
  if (typeof detail?.message === 'string') {
    return detail.message
  }
  return undefined
}

/** The machine-readable `error` code the impact assessor put on a failure, when it sent one. */
export const upstreamErrorCode = (error) => {
  const { detail } = parseBody(error?.data?.payload) ?? {}
  return typeof detail?.error === 'string' ? detail.error : undefined
}

const dataSyncHeaders = () =>
  buildServiceHeaders({
    traceHeaderName: config.get('tracing.header'),
    serviceKey: config.get('impactAssessor.dataSyncToken'),
    serviceKeyHeaderName: 'x-data-sync-token'
  })

const apiKeyHeaders = () =>
  buildServiceHeaders({
    traceHeaderName: config.get('tracing.header'),
    serviceKey: config.get('impactAssessor.apiKey')
  })

/**
 * Calls an impact assessor endpoint with the API key and tracing header,
 * returning either its payload or the failure the caller shows the user.
 *
 * @param {object} params
 * @param {'get' | 'post' | 'patch' | 'delete'} params.method
 * @param {string} params.path
 * @param {object} [params.body]
 * @param {string} params.action Describes the call in log messages
 * @returns {Promise<{ payload?: any, error?: string, statusCode?: number, detail?: string, code?: string }>}
 */
export async function callImpactAssessor({ method, path, body, action }) {
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
    return {
      error: action,
      statusCode,
      detail: upstreamDetail(error),
      code: upstreamErrorCode(error)
    }
  }
}

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
