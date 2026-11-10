import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'

// Set before config.js is imported, since convict reads the environment then.
vi.hoisted(() => {
  process.env.IMPACT_ASSESSOR_API_KEY = 'api-key'
})

import { setupMswServer } from '#/test-utils/setup-msw-server.js'
import { config } from '#/config/config.js'
import {
  getBasePrices,
  addBasePrice,
  updateBasePrice,
  deleteBasePrice
} from './impact-assessor-base-prices.js'

const baseUrl = `${config.get('impactAssessor.apiUrl')}/base-prices`
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

describe('impact assessor base prices service', () => {
  describe('getBasePrices', () => {
    it('returns the EDPs, sending the api key and no content type', async () => {
      const requests = capture('get', baseUrl, () =>
        HttpResponse.json([{ edpId: 1, basePrices: [] }])
      )

      const result = await getBasePrices()

      expect(result).toEqual({ edps: [{ edpId: 1, basePrices: [] }] })
      expect(requests[0].headers.get('x-api-key')).toBe('api-key')
      expect(requests[0].headers.get('content-type')).toBeNull()
    })

    it('reports the status code when the call fails', async () => {
      capture('get', baseUrl, failWith(500, {}))

      expect(await getBasePrices()).toEqual({
        error: 'Unable to fetch base prices',
        statusCode: 500,
        detail: undefined
      })
    })
  })

  describe('addBasePrice', () => {
    it('sends the body as JSON and returns the saved base price', async () => {
      const requests = capture('post', baseUrl, () =>
        HttpResponse.json({ id: 3 }, { status: 201 })
      )

      const result = await addBasePrice({ edpId: 1, basePrice: 2800.5 })

      expect(result).toEqual({ basePrice: { id: 3 } })
      expect(requests[0].headers.get('content-type')).toBe('application/json')
      expect(JSON.parse(requests[0].body)).toEqual({
        edpId: 1,
        basePrice: 2800.5
      })
    })

    it('returns the impact assessor reason when it rejects the base price', async () => {
      capture('post', baseUrl, failWith(409, { detail: 'already has one' }))

      expect(await addBasePrice({})).toEqual({
        error: 'Unable to add base price',
        statusCode: 409,
        detail: 'already has one'
      })
    })
  })

  describe('updateBasePrice', () => {
    it('patches the base price with a JSON body', async () => {
      const requests = capture('patch', `${baseUrl}/7`, () =>
        HttpResponse.json({ id: 7 })
      )

      const result = await updateBasePrice({ id: 7, changes: { comment: 'x' } })

      expect(result).toEqual({ basePrice: { id: 7 } })
      expect(requests[0].headers.get('content-type')).toBe('application/json')
      expect(JSON.parse(requests[0].body)).toEqual({ comment: 'x' })
    })

    it('reports the status code when the base price has taken effect', async () => {
      capture('patch', `${baseUrl}/7`, failWith(409, {}))

      const result = await updateBasePrice({ id: 7, changes: {} })

      expect(result).toMatchObject({
        error: 'Unable to change base price',
        statusCode: 409
      })
    })
  })

  describe('deleteBasePrice', () => {
    it('reports the base price as deleted', async () => {
      const requests = capture(
        'delete',
        `${baseUrl}/7`,
        () => new HttpResponse(null, { status: 204 })
      )

      expect(await deleteBasePrice(7)).toEqual({ deleted: true })
      expect(requests[0].headers.get('content-type')).toBeNull()
    })

    it('reports the status code when the base price cannot be deleted', async () => {
      capture('delete', `${baseUrl}/7`, failWith(404, {}))

      expect(await deleteBasePrice(7)).toMatchObject({
        error: 'Unable to delete base price',
        statusCode: 404
      })
    })
  })
})
