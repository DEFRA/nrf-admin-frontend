import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@hapi/wreck', () => ({
  default: { post: vi.fn(), get: vi.fn() }
}))
vi.mock('@defra/hapi-tracing', () => ({
  withTraceId: () => ({})
}))
vi.mock('../../../config/config.js', async (importOriginal) => {
  const actual = await importOriginal()
  const realGet = actual.config.get.bind(actual.config)
  const overrides = {
    'impactAssessor.apiUrl': 'http://localhost:8085',
    'impactAssessor.dataSyncToken': 'sync-token'
  }
  return {
    config: { get: (key) => overrides[key] ?? realGet(key) }
  }
})

import Wreck from '@hapi/wreck'
import { triggerDataSync, getDataSyncStatus } from './impact-assessor.js'

describe('impact-assessor service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('triggerDataSync', () => {
    it('posts with the token header and maps the response', async () => {
      Wreck.post.mockResolvedValue({
        payload: { run_id: 'r1', status: 'running' }
      })

      const result = await triggerDataSync({ force: true })

      expect(result).toEqual({ runId: 'r1', status: 'running' })
      const [url, opts] = Wreck.post.mock.calls[0]
      expect(url).toBe('http://localhost:8085/admin/data-sync?force=true')
      expect(opts.headers['x-data-sync-token']).toBe('sync-token')
    })

    it('defaults force to false', async () => {
      Wreck.post.mockResolvedValue({
        payload: { run_id: 'r1', status: 'running' }
      })
      await triggerDataSync()
      expect(Wreck.post.mock.calls[0][0]).toBe(
        'http://localhost:8085/admin/data-sync?force=false'
      )
    })

    it('returns error shape with statusCode on failure (e.g. 409)', async () => {
      const err = Object.assign(new Error('conflict'), {
        output: { statusCode: 409 }
      })
      Wreck.post.mockRejectedValue(err)
      expect(await triggerDataSync({ force: false })).toEqual({
        error: 'Unable to trigger data sync',
        statusCode: 409
      })
    })
  })

  describe('getDataSyncStatus', () => {
    it('returns the upstream payload', async () => {
      Wreck.get.mockResolvedValue({
        payload: { run_id: 'r1', status: 'complete', data_version: 'v3' }
      })
      expect(await getDataSyncStatus('r1')).toEqual({
        run_id: 'r1',
        status: 'complete',
        data_version: 'v3'
      })
    })

    it('returns error shape with statusCode on failure', async () => {
      const err = Object.assign(new Error('nope'), {
        output: { statusCode: 404 }
      })
      Wreck.get.mockRejectedValue(err)
      expect(await getDataSyncStatus('r1')).toEqual({
        error: 'Unable to fetch data sync status',
        statusCode: 404
      })
    })
  })
})
