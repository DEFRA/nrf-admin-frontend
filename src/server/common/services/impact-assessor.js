import Wreck from '@hapi/wreck'
import { withTraceId } from '@defra/hapi-tracing'

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

const dataSyncHeaders = () => {
  const headers = withTraceId(config.get('tracing.header'))
  const token = config.get('impactAssessor.dataSyncToken')
  if (token) {
    headers['x-data-sync-token'] = token
  }
  return headers
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
    const statusCode = error?.output?.statusCode
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
    const statusCode = error?.output?.statusCode
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
    const statusCode = error?.output?.statusCode
    logger.error(
      error,
      `Error fetching data sync status - url: ${url}, runId: ${runId}, statusCode: ${statusCode}`
    )
    // A failed run's payload carries its own `error` field, so signal
    // transport failures under a distinct key.
    return { serviceError: 'Unable to fetch data sync status', statusCode }
  }
}
