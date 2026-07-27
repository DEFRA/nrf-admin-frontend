import { StatusCodes } from 'http-status-codes'

import {
  triggerDataSync,
  rollbackDataSync,
  getDataSyncStatus
} from '../../../common/services/impact-assessor.js'

const UPSTREAM_UNAVAILABLE = 'Upstream data sync service unavailable'

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
      .response({ error: UPSTREAM_UNAVAILABLE })
      .code(StatusCodes.BAD_GATEWAY)
  }

  // Upstream accepts and runs the reload in the background (202).
  return h
    .response({ runId: result.runId, status: result.status })
    .code(StatusCodes.ACCEPTED)
}

export const rollbackHandler = async (request, h) => {
  const { tables } = request.payload ?? {}

  const result = await rollbackDataSync({ tables })

  if (result.error) {
    if (result.statusCode === StatusCodes.CONFLICT) {
      return h
        .response({ error: 'A data sync run is currently in progress' })
        .code(StatusCodes.CONFLICT)
    }
    // Upstream 400 = nothing to roll back, or a table outside its allow-list.
    if (result.statusCode === StatusCodes.BAD_REQUEST) {
      return h
        .response({
          error: 'No reference tables to roll back, or an unknown table named'
        })
        .code(StatusCodes.BAD_REQUEST)
    }
    return h
      .response({ error: UPSTREAM_UNAVAILABLE })
      .code(StatusCodes.BAD_GATEWAY)
  }

  return h
    .response({ rolledBack: result.rolledBack, skipped: result.skipped })
    .code(StatusCodes.OK)
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
      .response({ error: UPSTREAM_UNAVAILABLE })
      .code(StatusCodes.BAD_GATEWAY)
  }

  return h.response(result).code(StatusCodes.OK)
}
