import { StatusCodes } from 'http-status-codes'

import {
  triggerDataSync,
  getDataSyncStatus
} from '../../../common/services/impact-assessor.js'

export const triggerHandler = async (request, h) => {
  const { force } = request.query
  const manifest = request.payload

  const result = await triggerDataSync({ force, manifest })

  if (result.error) {
    if (result.statusCode === StatusCodes.CONFLICT) {
      return h
        .response({ error: 'A data sync run is already in progress' })
        .code(StatusCodes.CONFLICT)
    }
    return h
      .response({ error: 'Upstream data sync service unavailable' })
      .code(StatusCodes.BAD_GATEWAY)
  }

  // Upstream accepts and runs the reload in the background (202).
  return h
    .response({ runId: result.runId, status: result.status })
    .code(StatusCodes.ACCEPTED)
}

export const statusHandler = async (request, h) => {
  const { runId } = request.params

  const result = await getDataSyncStatus(runId)

  if (result.serviceError) {
    if (result.statusCode === StatusCodes.NOT_FOUND) {
      return h
        .response({ error: 'Data sync run not found' })
        .code(StatusCodes.NOT_FOUND)
    }
    return h
      .response({ error: 'Upstream data sync service unavailable' })
      .code(StatusCodes.BAD_GATEWAY)
  }

  return h.response(result).code(StatusCodes.OK)
}
