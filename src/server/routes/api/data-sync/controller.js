import {
  triggerDataSync,
  getDataSyncStatus
} from '../../../common/services/impact-assessor.js'

export const triggerHandler = async (request, h) => {
  const { force } = request.query

  const result = await triggerDataSync({ force })

  if (result.error) {
    if (result.statusCode === 409) {
      return h
        .response({ error: 'A data sync run is already in progress' })
        .code(409)
    }
    return h
      .response({ error: 'Upstream data sync service unavailable' })
      .code(502)
  }

  // Upstream accepts and runs the reload in the background (202).
  return h.response({ runId: result.runId, status: result.status }).code(202)
}

export const statusHandler = async (request, h) => {
  const { runId } = request.params

  const result = await getDataSyncStatus(runId)

  if (result.error) {
    if (result.statusCode === 404) {
      return h.response({ error: 'Data sync run not found' }).code(404)
    }
    return h
      .response({ error: 'Upstream data sync service unavailable' })
      .code(502)
  }

  return h.response(result).code(200)
}
