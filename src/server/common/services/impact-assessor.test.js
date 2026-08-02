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
import {
  triggerDataSync,
  rollbackDataSync,
  getDataSyncStatus
} from './impact-assessor.js'

describe('impact-assessor service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('triggerDataSync', () => {
    it('posts the manifest body with the token header and maps the response', async () => {
      Wreck.post.mockResolvedValue({
        payload: { run_id: 'r1', status: 'running' }
      })
      const manifest = {
        tables: {
          edp_boundary_layer: {
            key: '20260521/abc/def',
            version: '20260605_120000'
          }
        }
      }

      const result = await triggerDataSync({ force: true, manifest })

      expect(result).toEqual({ runId: 'r1', status: 'running' })
      const [url, opts] = Wreck.post.mock.calls[0]
      expect(url).toBe('http://localhost:8085/admin/data-sync?force=true')
      expect(opts.headers['x-data-sync-token']).toBe('sync-token')
      expect(opts.headers['Content-Type']).toBe('application/json')
      expect(JSON.parse(opts.payload)).toEqual(manifest)
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

    it('surfaces the upstream detail from a 422 validation body', async () => {
      const err = Object.assign(new Error('unprocessable'), {
        output: { statusCode: 422 },
        data: {
          payload: Buffer.from(
            JSON.stringify({
              detail: [
                { msg: 'Value error, manifest part keys are not contiguous' }
              ]
            })
          )
        }
      })
      Wreck.post.mockRejectedValue(err)
      expect(await triggerDataSync({ force: false })).toEqual({
        error: 'Unable to trigger data sync',
        statusCode: 422,
        detail: 'Value error, manifest part keys are not contiguous'
      })
    })

    it('surfaces a string detail and tolerates an unparseable body', async () => {
      const withPayload = (payload) =>
        Object.assign(new Error('bad'), {
          output: { statusCode: 400 },
          data: { payload }
        })

      Wreck.post.mockRejectedValue(withPayload({ detail: 'no such table' }))
      expect((await triggerDataSync()).detail).toBe('no such table')

      Wreck.post.mockRejectedValue(withPayload(Buffer.from('<html>502</html>')))
      expect((await triggerDataSync()).detail).toBeUndefined()
    })
  })

  describe('rollbackDataSync', () => {
    it('posts an explicit table list with the token header and maps the response', async () => {
      Wreck.post.mockResolvedValue({
        payload: {
          rolled_back: { edp_boundary_layer: { from: 3, to: 2 } },
          skipped: { edp_excluded_areas: 'no prior version' }
        }
      })

      const result = await rollbackDataSync({ tables: ['edp_boundary_layer'] })

      expect(result).toEqual({
        rolledBack: { edp_boundary_layer: { from: 3, to: 2 } },
        skipped: { edp_excluded_areas: 'no prior version' }
      })
      const [url, opts] = Wreck.post.mock.calls[0]
      expect(url).toBe('http://localhost:8085/admin/data-sync/rollback')
      expect(opts.headers['x-data-sync-token']).toBe('sync-token')
      expect(JSON.parse(opts.payload)).toEqual({
        tables: ['edp_boundary_layer']
      })
    })

    it('posts an empty body when no tables are named', async () => {
      Wreck.post.mockResolvedValue({
        payload: { rolled_back: {}, skipped: {} }
      })
      await rollbackDataSync()
      expect(JSON.parse(Wreck.post.mock.calls[0][1].payload)).toEqual({})
    })

    it('returns error shape with statusCode on failure (e.g. 409)', async () => {
      const err = Object.assign(new Error('conflict'), {
        output: { statusCode: 409 }
      })
      Wreck.post.mockRejectedValue(err)
      expect(await rollbackDataSync()).toEqual({
        error: 'Unable to roll back data sync',
        statusCode: 409
      })
    })

    it('surfaces the upstream detail from a 400', async () => {
      Wreck.post.mockRejectedValue(
        Object.assign(new Error('bad request'), {
          output: { statusCode: 400 },
          data: {
            payload: Buffer.from(
              JSON.stringify({
                detail: 'not in the data-sync allow-list: made_up_table'
              })
            )
          }
        })
      )
      expect(await rollbackDataSync({ tables: ['made_up_table'] })).toEqual({
        error: 'Unable to roll back data sync',
        statusCode: 400,
        detail: 'not in the data-sync allow-list: made_up_table'
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

    it('returns serviceError shape with statusCode on failure', async () => {
      const err = Object.assign(new Error('nope'), {
        output: { statusCode: 404 }
      })
      Wreck.get.mockRejectedValue(err)
      expect(await getDataSyncStatus('r1')).toEqual({
        serviceError: 'Unable to fetch data sync status',
        statusCode: 404
      })
    })
  })
})
