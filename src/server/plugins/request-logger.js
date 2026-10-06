import { createRequestLogger } from '@defra/nrf-library'

import { loggerOptions } from './logger-options.js'

const pathToIgnore = (_, request) =>
  request.path.startsWith('/public') ||
  request.path === '/health' ||
  request.path === '/favicon.ico'

const requestLogger = createRequestLogger(loggerOptions, {
  ignoreFunc: pathToIgnore
})

export { requestLogger }
