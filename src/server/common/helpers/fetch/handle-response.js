import Boom from '@hapi/boom'

import { statusCodes } from '../../constants/status-codes.js'

const highestSuccessStatusCode = 299

function handleResponse({ res, payload }) {
  if (
    !res.statusCode ||
    res.statusCode < statusCodes.ok ||
    res.statusCode > highestSuccessStatusCode
  ) {
    return { res, error: payload || Boom.boomify(new Error('Unknown error')) }
  }

  return { res, payload }
}

export { handleResponse }
