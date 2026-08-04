import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'

// Set before config.js is imported, since convict reads the environment then.
vi.hoisted(() => {
  process.env.DATA_SYNC_TOKEN = 'sync-token'
})

import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { config } from '#/config/config.js'
import {
  triggerDataSync,
  rollbackDataSync,
  getDataSyncStatus
} from './impact-assessor.js'

const baseUrl = config.get('impactAssessor.apiUrl')
const TRIGGER_URL = `${baseUrl}/admin/data-sync`
const ROLLBACK_URL = `${baseUrl}/admin/data-sync/rollback`
const STATUS_URL = `${baseUrl}/admin/data-sync/:runId`

const mswServer = setupMswServer()

function capture(method, url, respond) {
  const requests = []
  mswServer.use(
    http[method](url, async ({ request }) => {
      const text = await request.text()
      requests.push({
        url: new URL(request.url),
        headers: request.headers,
        body: text ? JSON.parse(text) : undefined
      })
      return respond()
    })
  )
  return requests
}

const MANIFEST = {
  tables: {
    edp_boundary_layer: {
      key: '20260521/abc/def',
      version: '20260605_120000'
    }
  }
}

describe('impact-assessor service', () => {
  describe('triggerDataSync', () => {
    it('posts the manifest body with the token header and maps the response', async () => {
      const requests = capture('post', TRIGGER_URL, () =>
        HttpResponse.json({ run_id: 'r1', status: 'running' })
      )

      const result = await triggerDataSync({ force: true, manifest: MANIFEST })

      expect(result).toEqual({ runId: 'r1', status: 'running' })
      expect(requests).toHaveLength(1)
      const [request] = requests
      expect(request.url.pathname).toBe('/admin/data-sync')
      expect(request.url.searchParams.get('force')).toBe('true')
      expect(request.headers.get('x-data-sync-token')).toBe('sync-token')
      expect(request.headers.get('content-type')).toBe('application/json')
      expect(request.body).toEqual(MANIFEST)
    })

    it('defaults force to false', async () => {
      const requests = capture('post', TRIGGER_URL, () =>
        HttpResponse.json({ run_id: 'r1', status: 'running' })
      )

      await triggerDataSync()

      expect(requests[0].url.searchParams.get('force')).toBe('false')
    })

    it('returns error shape with statusCode on failure (e.g. 409)', async () => {
      mswServer.use(
        http.post(TRIGGER_URL, () =>
          HttpResponse.json(
            { detail: 'a run is already in progress' },
            {
              status: 409
            }
          )
        )
      )

      expect(await triggerDataSync({ force: false })).toEqual({
        error: 'Unable to trigger data sync',
        statusCode: 409,
        detail: 'a run is already in progress'
      })
    })

    it('surfaces the upstream detail from a 422 validation body', async () => {
      mswServer.use(
        http.post(TRIGGER_URL, () =>
          HttpResponse.json(
            {
              detail: [
                { msg: 'Value error, manifest part keys are not contiguous' }
              ]
            },
            { status: 422 }
          )
        )
      )

      expect(await triggerDataSync({ force: false })).toEqual({
        error: 'Unable to trigger data sync',
        statusCode: 422,
        detail: 'Value error, manifest part keys are not contiguous'
      })
    })

    it('surfaces a string detail from a 400', async () => {
      mswServer.use(
        http.post(TRIGGER_URL, () =>
          HttpResponse.json({ detail: 'no such table' }, { status: 400 })
        )
      )

      expect((await triggerDataSync()).detail).toBe('no such table')
    })

    it('tolerates a non-JSON error body', async () => {
      mswServer.use(
        http.post(
          TRIGGER_URL,
          () =>
            new HttpResponse('502 Bad Gateway', {
              status: 502,
              headers: { 'Content-Type': 'text/plain' }
            })
        )
      )

      expect(await triggerDataSync()).toEqual({
        error: 'Unable to trigger data sync',
        statusCode: 502,
        detail: undefined
      })
    })

    it('returns the error shape when the upstream is unreachable', async () => {
      mswServer.use(http.post(TRIGGER_URL, () => HttpResponse.error()))

      expect(await triggerDataSync()).toMatchObject({
        error: 'Unable to trigger data sync'
      })
    })
  })

  describe('rollbackDataSync', () => {
    it('posts an explicit table list with the token header and maps the response', async () => {
      const requests = capture('post', ROLLBACK_URL, () =>
        HttpResponse.json({
          rolled_back: { edp_boundary_layer: { from: 3, to: 2 } },
          skipped: { edp_excluded_areas: 'no prior version' }
        })
      )

      const result = await rollbackDataSync({ tables: ['edp_boundary_layer'] })

      expect(result).toEqual({
        rolledBack: { edp_boundary_layer: { from: 3, to: 2 } },
        skipped: { edp_excluded_areas: 'no prior version' }
      })
      const [request] = requests
      expect(request.url.pathname).toBe('/admin/data-sync/rollback')
      expect(request.headers.get('x-data-sync-token')).toBe('sync-token')
      expect(request.body).toEqual({ tables: ['edp_boundary_layer'] })
    })

    it('posts an empty body when no tables are named', async () => {
      const requests = capture('post', ROLLBACK_URL, () =>
        HttpResponse.json({ rolled_back: {}, skipped: {} })
      )

      await rollbackDataSync()

      expect(requests[0].body).toEqual({})
    })

    it('returns error shape with statusCode on failure (e.g. 409)', async () => {
      mswServer.use(
        http.post(ROLLBACK_URL, () => new HttpResponse(null, { status: 409 }))
      )

      expect(await rollbackDataSync()).toEqual({
        error: 'Unable to roll back data sync',
        statusCode: 409,
        detail: undefined
      })
    })

    it('surfaces the upstream detail from a 400', async () => {
      mswServer.use(
        http.post(ROLLBACK_URL, () =>
          HttpResponse.json(
            { detail: 'not in the data-sync allow-list: made_up_table' },
            { status: 400 }
          )
        )
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
      const requests = capture('get', STATUS_URL, () =>
        HttpResponse.json({
          run_id: 'r1',
          status: 'complete',
          data_version: 'v3'
        })
      )

      expect(await getDataSyncStatus('r1')).toEqual({
        run_id: 'r1',
        status: 'complete',
        data_version: 'v3'
      })
      expect(requests[0].url.pathname).toBe('/admin/data-sync/r1')
      expect(requests[0].headers.get('x-data-sync-token')).toBe('sync-token')
    })

    it('returns serviceError shape with statusCode on failure', async () => {
      mswServer.use(
        http.get(STATUS_URL, () => new HttpResponse(null, { status: 404 }))
      )

      expect(await getDataSyncStatus('r1')).toEqual({
        serviceError: 'Unable to fetch data sync status',
        statusCode: 404
      })
    })
  })
})
