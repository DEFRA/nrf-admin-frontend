import { createServer } from '#/server/server.js'

describe('#contentSecurityPolicy', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should set the CSP policy header', async () => {
    const resp = await server.inject({
      method: 'GET',
      url: '/'
    })

    expect(resp.headers['content-security-policy']).toBeDefined()
  })

  test('Should include base-uri self', async () => {
    const resp = await server.inject({ method: 'GET', url: '/' })
    expect(resp.headers['content-security-policy']).toContain("base-uri 'self'")
  })

  test('Should restrict worker-src to none', async () => {
    const resp = await server.inject({ method: 'GET', url: '/' })
    expect(resp.headers['content-security-policy']).toContain(
      "worker-src 'none'"
    )
  })

  test('Should restrict media-src to none', async () => {
    const resp = await server.inject({ method: 'GET', url: '/' })
    expect(resp.headers['content-security-policy']).toContain(
      "media-src 'none'"
    )
  })

  test('Should not allow data: in connect-src', async () => {
    const resp = await server.inject({ method: 'GET', url: '/' })
    const csp = resp.headers['content-security-policy']
    const connectSrc = csp.match(/connect-src ([^;]+)/)?.[1] ?? ''
    expect(connectSrc).not.toContain('data:')
  })

  test('Should not allow data: in font-src', async () => {
    const resp = await server.inject({ method: 'GET', url: '/' })
    const csp = resp.headers['content-security-policy']
    const fontSrc = csp.match(/font-src ([^;]+)/)?.[1] ?? ''
    expect(fontSrc).not.toContain('data:')
  })
})
