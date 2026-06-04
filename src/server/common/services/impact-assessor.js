import Wreck from '@hapi/wreck'
import { withTraceId } from '@defra/hapi-tracing'

import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'

const logger = createLogger()

const dataSyncHeaders = () => {
  const headers = withTraceId(config.get('tracing.header'))
  const token = config.get('impactAssessor.dataSyncToken')
  if (token) {
    headers['x-data-sync-token'] = token
  }
  return headers
}

export async function triggerDataSync({ force = false } = {}) {
  const baseUrl = config.get('impactAssessor.apiUrl')
  const url = `${baseUrl}/admin/data-sync?force=${force ? 'true' : 'false'}`

  logger.info(`Triggering data sync - url: ${url}, force: ${force}`)

  try {
    const { payload } = await Wreck.post(url, {
      json: true,
      headers: dataSyncHeaders()
    })
    return { runId: payload.run_id, status: payload.status }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    logger.error(
      error,
      `Error triggering data sync - url: ${url}, statusCode: ${statusCode}`
    )
    return { error: 'Unable to trigger data sync', statusCode }
  }
}

export async function getDataSyncStatus(runId) {
  const baseUrl = config.get('impactAssessor.apiUrl')
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
    return { error: 'Unable to fetch data sync status', statusCode }
  }
}
