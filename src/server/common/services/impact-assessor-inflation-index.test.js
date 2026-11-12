import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'

// Set before config.js is imported, since convict reads the environment then.
vi.hoisted(() => {
  process.env.IMPACT_ASSESSOR_API_KEY = 'api-key'
})

import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { config } from '#/config/config.js'
import {
  addInflationIndex,
  deleteInflationIndex,
  getInflationIndexes,
  updateInflationIndex
} from './impact-assessor-inflation-index.js'

const baseUrl = `${config.get('impactAssessor.apiUrl')}/inflation-indexes`
const mswServer = setupMswServer()

function capture(method, url, respond) {
  const requests = []
  mswServer.use(
    http[method](url, async ({ request }) => {
      requests.push({
        headers: request.headers,
        body: (await request.text()) || undefined
      })
      return respond()
    })
  )
  return requests
}

const failWith = (status, body) => () => HttpResponse.json(body, { status })

describe('impact assessor inflation index service', () => {
  describe('getInflationIndexes', () => {
    it('returns the indexes, sending the api key and no content type', async () => {
      const requests = capture('get', baseUrl, () => HttpResponse.json([]))

      const result = await getInflationIndexes()

      expect(result).toEqual({ inflationIndexes: [] })
      expect(requests[0].headers.get('x-api-key')).toBe('api-key')
      expect(requests[0].headers.get('content-type')).toBeNull()
    })

    it('reports the status code when the call fails', async () => {
      capture('get', baseUrl, failWith(500, {}))

      expect(await getInflationIndexes()).toEqual({
        error: 'Unable to fetch inflation indexes',
        statusCode: 500,
        detail: undefined
      })
    })
  })

  describe('addInflationIndex', () => {
    it('sends the body as JSON and returns the saved index', async () => {
      const requests = capture('post', baseUrl, () =>
        HttpResponse.json({ id: 'new-id' }, { status: 201 })
      )

      const result = await addInflationIndex({
        chargingYear: 2028,
        cilIndex: 384.21
      })

      expect(result).toEqual({ inflationIndex: { id: 'new-id' } })
      expect(requests[0].headers.get('content-type')).toBe('application/json')
      expect(JSON.parse(requests[0].body)).toEqual({
        chargingYear: 2028,
        cilIndex: 384.21
      })
    })

    it('returns the impact assessor reason when it rejects the index', async () => {
      capture('post', baseUrl, failWith(409, { detail: 'already exists' }))

      expect(await addInflationIndex({})).toEqual({
        error: 'Unable to add inflation index',
        statusCode: 409,
        detail: 'already exists'
      })
    })
  })

  describe('updateInflationIndex', () => {
    it('patches the changes and returns the saved index', async () => {
      const url = `${baseUrl}/an-id`
      const requests = capture('patch', url, () =>
        HttpResponse.json({ id: 'an-id' })
      )

      const result = await updateInflationIndex({
        id: 'an-id',
        changes: { cilIndex: 390.5 }
      })

      expect(result).toEqual({ inflationIndex: { id: 'an-id' } })
      expect(JSON.parse(requests[0].body)).toEqual({ cilIndex: 390.5 })
    })

    it('returns the impact assessor reason when it refuses the change', async () => {
      capture('patch', `${baseUrl}/an-id`, failWith(409, { detail: 'no' }))

      expect(await updateInflationIndex({ id: 'an-id', changes: {} })).toEqual({
        error: 'Unable to change inflation index',
        statusCode: 409,
        detail: 'no'
      })
    })
  })

  describe('deleteInflationIndex', () => {
    it('deletes and reports success without a payload', async () => {
      const url = `${baseUrl}/an-id`
      const requests = capture(
        'delete',
        url,
        () => new HttpResponse(null, { status: 204 })
      )

      const result = await deleteInflationIndex('an-id')

      expect(result).toEqual({ deleted: true })
      expect(requests[0].body).toBeUndefined()
    })

    it('returns the impact assessor code and message when it refuses the delete', async () => {
      capture(
        'delete',
        `${baseUrl}/an-id`,
        failWith(409, {
          detail: {
            error: 'inflation_index_in_use',
            message: 'has been used to price a quote'
          }
        })
      )

      expect(await deleteInflationIndex('an-id')).toEqual({
        error: 'Unable to delete inflation index',
        statusCode: 409,
        detail: 'has been used to price a quote',
        code: 'inflation_index_in_use'
      })
    })
  })
})
