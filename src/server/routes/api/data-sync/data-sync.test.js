import { describe, it, expect, beforeEach, vi } from 'vitest'
import Hapi from '@hapi/hapi'

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

async function buildServer() {
  const server = Hapi.server()
  await server.register([bearerAuth, apiDataSync])
  return server
}

describe('POST /api/data-sync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth', async () => {
    const server = await buildServer()
    const res = await server.inject({ method: 'POST', url: '/api/data-sync' })
    expect(res.statusCode).toBe(401)
    expect(triggerDataSync).not.toHaveBeenCalled()
  })

  it('returns 202 with runId and passes force through', async () => {
    triggerDataSync.mockResolvedValue({ runId: 'r1', status: 'running' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/data-sync?force=true',
      headers: auth
    })
    expect(res.statusCode).toBe(202)
    expect(JSON.parse(res.payload)).toEqual({ runId: 'r1', status: 'running' })
    expect(triggerDataSync).toHaveBeenCalledWith({ force: true })
  })

  it('defaults force to false when omitted', async () => {
    triggerDataSync.mockResolvedValue({ runId: 'r1', status: 'running' })
    const server = await buildServer()
    await server.inject({
      method: 'POST',
      url: '/api/data-sync',
      headers: auth
    })
    expect(triggerDataSync).toHaveBeenCalledWith({ force: false })
  })

  it('maps upstream 409 to 409', async () => {
    triggerDataSync.mockResolvedValue({
      error: 'Unable to trigger data sync',
      statusCode: 409
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/data-sync',
      headers: auth
    })
    expect(res.statusCode).toBe(409)
  })

  it('returns 502 on other upstream failures', async () => {
    triggerDataSync.mockResolvedValue({
      error: 'Unable to trigger data sync',
      statusCode: 500
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/data-sync',
      headers: auth
    })
    expect(res.statusCode).toBe(502)
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
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toMatchObject({ status: 'complete' })
  })

  it('returns 400 for a non-uuid runId', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: '/api/data-sync/not-a-uuid',
      headers: auth
    })
    expect(res.statusCode).toBe(400)
  })

  it('maps upstream 404 to 404', async () => {
    getDataSyncStatus.mockResolvedValue({
      error: 'Unable to fetch data sync status',
      statusCode: 404
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: `/api/data-sync/${RUN_ID}`,
      headers: auth
    })
    expect(res.statusCode).toBe(404)
  })
})
