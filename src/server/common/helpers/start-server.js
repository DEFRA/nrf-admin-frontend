import { enableAuditing } from '@defra/cdp-auditing'
import { createServer } from '../../server.js'
import { config } from '../../../config/config.js'

async function startServer() {
  enableAuditing(config.get('audit.isEnabled'))

  const server = await createServer()
  await server.start()

  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your frontend on http://localhost:${config.get('port')}`
  )

  return server
}

export { startServer }
