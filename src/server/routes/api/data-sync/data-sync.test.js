import { describe, it, expect, beforeEach, vi } from 'vitest'
import Hapi from '@hapi/hapi'
import { StatusCodes } from 'http-status-codes'

vi.mock('#/config/config.js', () => ({
  config: {
    get: (k) => ({ 'api.bearerToken': 'secret-token' })[k]
  }
}))

vi.mock('../../../common/services/impact-assessor.js', () => ({
  triggerDataSync: vi.fn(),
  getDataSyncStatus: vi.fn()
}))

import {
  triggerDataSync,
  getDataSyncStatus
} from '../../../common/services/impact-assessor.js'
import { bearerAuth } from '../../../common/helpers/auth/bearer-auth.js'
import { apiDataSync } from './index.js'

const auth = { authorization: 'Bearer secret-token' }
const RUN_ID = '11111111-2222-4333-8444-555555555555'
const DATA_SYNC_URL = '/api/data-sync'
const MANIFEST = {
  data_version: '20260605_120000',
  tables: { edp_boundary_layer: '20260521/abc/def' }
}

async function buildServer() {
  const server = Hapi.server()
  await server.register([bearerAuth, apiDataSync])
  return server
}

async function postDataSync({
  url = DATA_SYNC_URL,
  headers = auth,
  payload = MANIFEST
} = {}) {
  const server = await buildServer()
  return server.inject({ method: 'POST', url, headers, payload })
}

describe('POST /api/data-sync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth', async () => {
    const res = await postDataSync({ headers: {} })
    expect(res.statusCode).toBe(StatusCodes.UNAUTHORIZED)
    expect(triggerDataSync).not.toHaveBeenCalled()
  })

  it('returns 202 with runId and passes force and manifest through', async () => {
    triggerDataSync.mockResolvedValue({ runId: 'r1', status: 'running' })
    const res = await postDataSync({ url: `${DATA_SYNC_URL}?force=true` })
    expect(res.statusCode).toBe(StatusCodes.ACCEPTED)
    expect(JSON.parse(res.payload)).toEqual({ runId: 'r1', status: 'running' })
    expect(triggerDataSync).toHaveBeenCalledWith({
      force: true,
      manifest: MANIFEST
    })
  })

  it('defaults force to false when omitted', async () => {
    triggerDataSync.mockResolvedValue({ runId: 'r1', status: 'running' })
    await postDataSync()
    expect(triggerDataSync).toHaveBeenCalledWith({
      force: false,
      manifest: MANIFEST
    })
  })
})

describe('POST /api/data-sync - validation and upstream errors', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a missing body', async () => {
    const res = await postDataSync({ payload: null })
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(triggerDataSync).not.toHaveBeenCalled()
  })

  it('rejects an empty tables map', async () => {
    const res = await postDataSync({
      payload: { data_version: 'v1', tables: {} }
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(triggerDataSync).not.toHaveBeenCalled()
  })

  it('maps upstream 409 to 409', async () => {
    triggerDataSync.mockResolvedValue({
      error: 'Unable to trigger data sync',
      statusCode: StatusCodes.CONFLICT
    })
    const res = await postDataSync()
    expect(res.statusCode).toBe(StatusCodes.CONFLICT)
  })

  it('returns 502 on other upstream failures', async () => {
    triggerDataSync.mockResolvedValue({
      error: 'Unable to trigger data sync',
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR
    })
    const res = await postDataSync()
    expect(res.statusCode).toBe(StatusCodes.BAD_GATEWAY)
  })
})

describe('GET /api/data-sync/{runId}', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with the upstream status payload', async () => {
    getDataSyncStatus.mockResolvedValue({ run_id: RUN_ID, status: 'complete' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: `/api/data-sync/${RUN_ID}`,
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toMatchObject({ status: 'complete' })
  })

  it('returns 400 for a non-uuid runId', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: '/api/data-sync/not-a-uuid',
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
  })

  it('relays a failed run payload with its error field as 200', async () => {
    getDataSyncStatus.mockResolvedValue({
      run_id: RUN_ID,
      status: 'failed',
      error: 'reference data dump not found'
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: `/api/data-sync/${RUN_ID}`,
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toMatchObject({
      status: 'failed',
      error: 'reference data dump not found'
    })
  })

  it('maps upstream 404 to 404', async () => {
    getDataSyncStatus.mockResolvedValue({
      serviceError: 'Unable to fetch data sync status',
      statusCode: StatusCodes.NOT_FOUND
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: `/api/data-sync/${RUN_ID}`,
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND)
  })
})
