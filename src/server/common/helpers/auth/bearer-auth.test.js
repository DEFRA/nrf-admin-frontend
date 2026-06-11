import { describe, it, expect, beforeAll, vi } from 'vitest'
import Hapi from '@hapi/hapi'

vi.mock('#src/config/config.js', () => ({
  config: {
    get: (k) => (k === 'api.bearerToken' ? 'secret-token' : undefined)
  }
}))

import { bearerAuth } from './bearer-auth.js'

async function buildServer() {
  const server = Hapi.server()
  await server.register(bearerAuth)
  server.route({
    method: 'GET',
    path: '/protected',
    options: { auth: 'api-bearer' },
    handler: () => ({ ok: true })
  })
  return server
}

describe('bearer-auth plugin', () => {
  let server
  beforeAll(async () => {
    server = await buildServer()
  })

  it('rejects requests with no Authorization header', async () => {
    const res = await server.inject({ method: 'GET', url: '/protected' })
    expect(res.statusCode).toBe(401)
  })

  it('rejects requests with wrong token', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer wrong' }
    })
    expect(res.statusCode).toBe(401)
  })

  it('rejects malformed Authorization header', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'NotBearer secret-token' }
    })
    expect(res.statusCode).toBe(401)
  })

  it('accepts requests with the correct token', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer secret-token' }
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({ ok: true })
  })
})
