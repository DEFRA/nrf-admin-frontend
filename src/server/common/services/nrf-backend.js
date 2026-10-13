import Wreck from '@hapi/wreck'
import { buildServiceHeaders, getRequestFromService } from '@defra/nrf-library'

import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'

const logger = createLogger()

const backendHeaders = () =>
  buildServiceHeaders({
    traceHeaderName: config.get('tracing.header'),
    serviceKey: config.get('backend.apiKey')
  })

export const getRequestFromBackend = ({ endpointPath }) =>
  getRequestFromService({
    url: `${config.get('backend.apiUrl')}${endpointPath}`,
    headers: backendHeaders(),
    logger,
    errorMessage: 'Backend request failed'
  })

/**
 * @param {object} params
 * @param {string} params.endpointPath - backend endpoint, e.g. /quotes/NRL-000001
 * @returns {Promise<object>} Wreck response with a parsed payload
 */
export const deleteRequestFromBackend = async ({ endpointPath }) => {
  try {
    const url = `${config.get('backend.apiUrl')}${endpointPath}`
    const response = await Wreck.delete(url, {
      json: true,
      headers: backendHeaders()
    })
    return response
  } catch (error) {
    logger.error(error, 'Backend delete request failed')
    throw error
  }
}
