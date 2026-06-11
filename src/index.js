import process from 'node:process'

import { startServer } from '#src/server/common/helpers/start-server.js'
import { createLogger } from '#src/server/common/helpers/logging/logger.js'

await startServer()

process.on('unhandledRejection', (error) => {
  const logger = createLogger()
  logger.info('Unhandled rejection')
  logger.error(error)
  process.exitCode = 1
})
