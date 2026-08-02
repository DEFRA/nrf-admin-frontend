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
    // Upstream 422 = the manifest cleared our schema but failed a check the
    // impact-assessor owns — part-key contiguity, most often. That is the
    // caller's payload at fault, not a dead upstream, so answer 400 and relay
    // the detail, which names the offending part.
    if (result.statusCode === StatusCodes.UNPROCESSABLE_ENTITY) {
      return h
        .response({ error: result.detail ?? 'Invalid data sync manifest' })
        .code(StatusCodes.BAD_REQUEST)
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
    // Its detail distinguishes the two and names the offending tables.
    if (result.statusCode === StatusCodes.BAD_REQUEST) {
      return h
        .response({
          error:
            result.detail ??
            'No reference tables to roll back, or an unknown table named'
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
