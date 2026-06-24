import { createServer } from '#/server/server.js'

describe('#securityHeaders', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('successful response', () => {
    let resp

    beforeAll(async () => {
      resp = await server.inject({ method: 'GET', url: '/' })
    })

    test('should set Permissions-Policy', () => {
      expect(resp.headers['permissions-policy']).toBe(
        'camera=(), microphone=(), geolocation=(), payment=()'
      )
    })

    test('should set Cross-Origin-Opener-Policy', () => {
      expect(resp.headers['cross-origin-opener-policy']).toBe('same-origin')
    })

    test('should set Cross-Origin-Embedder-Policy', () => {
      expect(resp.headers['cross-origin-embedder-policy']).toBe('require-corp')
    })

    test('should set Cross-Origin-Resource-Policy', () => {
      expect(resp.headers['cross-origin-resource-policy']).toBe('same-origin')
    })

    test('should set Referrer-Policy', () => {
      expect(resp.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin'
      )
    })
  })

  describe('error response', () => {
    let resp

    beforeAll(async () => {
      resp = await server.inject({ method: 'GET', url: '/non-existent-route' })
    })

    test('should set Permissions-Policy', () => {
      expect(resp.headers['permissions-policy']).toBe(
        'camera=(), microphone=(), geolocation=(), payment=()'
      )
    })

    test('should set Cross-Origin-Opener-Policy', () => {
      expect(resp.headers['cross-origin-opener-policy']).toBe('same-origin')
    })

    test('should set Cross-Origin-Embedder-Policy', () => {
      expect(resp.headers['cross-origin-embedder-policy']).toBe('require-corp')
    })

    test('should set Cross-Origin-Resource-Policy', () => {
      expect(resp.headers['cross-origin-resource-policy']).toBe('same-origin')
    })

    test('should set Referrer-Policy', () => {
      expect(resp.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin'
      )
    })
  })
})
