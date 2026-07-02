import Wreck from '@hapi/wreck'
import { withTraceId } from '@defra/hapi-tracing'

import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'
import { statusCodes } from '../constants/status-codes.js'

const logger = createLogger()

const frontendHeaders = () => {
  const headers = withTraceId(config.get('tracing.header'))
  const apiKey = config.get('frontend.apiKey')
  if (apiKey) {
    headers['x-api-key'] = apiKey
  }
  return headers
}

export const clearFrontendTileCache = async () => {
  try {
    const url = `${config.get('frontend.apiUrl')}/admin/tile-cache`
    const { res, payload } = await Wreck.delete(url, {
      headers: frontendHeaders(),
      json: true
    })
    if (res.statusCode !== statusCodes.ok) {
      throw new Error(`Unexpected status ${res.statusCode}`)
    }
    return payload.count
  } catch (error) {
    logger.error(error, 'Frontend tile cache clear request failed')
    throw error
  }
}
