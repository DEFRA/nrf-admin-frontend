import { buildLogger } from '@defra/nrf-library'

import { loggerOptions } from '../../../plugins/logger-options.js'

const logger = buildLogger(loggerOptions)

function createLogger() {
  return logger
}

export { createLogger }
