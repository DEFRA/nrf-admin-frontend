import { createPulse } from '@defra/nrf-library'

import { createLogger } from '../common/helpers/logging/logger.js'

const pulse = createPulse(createLogger())

export { pulse }
