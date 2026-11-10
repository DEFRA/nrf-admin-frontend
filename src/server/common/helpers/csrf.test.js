import { vi } from 'vitest'
import crumb from '@hapi/crumb'

import { csrf } from './csrf.js'

const mockConfigGet = vi.hoisted(() => vi.fn().mockReturnValue(false))

vi.mock('#/config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

describe('csrf', () => {
  beforeEach(() => {
    mockConfigGet.mockReturnValue(false)
  })

  it('uses the crumb plugin with the csrfToken key', () => {
    expect(csrf.plugin).toBe(crumb)
    expect(csrf.options.key).toBe('csrfToken')
    expect(csrf.options.size).toBe(43)
  })

  it('sends the cookie on cross-site navigations but not cross-site posts', () => {
    expect(csrf.options.cookieOptions.isSameSite).toBe('Lax')
  })

  it('only marks the cookie secure in production', async () => {
    expect(csrf.options.cookieOptions.isSecure).toBe(false)

    mockConfigGet.mockReturnValue(true)
    vi.resetModules()
    const { csrf: productionCsrf } = await import('./csrf.js')
    expect(productionCsrf.options.cookieOptions.isSecure).toBe(true)
  })

  describe('skip', () => {
    it('does not skip browser form routes outside the test environment', () => {
      expect(csrf.options.skip({ path: '/base-prices/add' })).toBe(false)
    })

    it('skips every route in the test environment', () => {
      mockConfigGet.mockReturnValue(true)
      expect(csrf.options.skip({ path: '/base-prices/add' })).toBe(true)
    })

    it.each([
      '/api/data-sync',
      '/api/uploads/initiate',
      '/upload-and-scan/abc',
      '/auth/callback'
    ])('skips %s, which is not a browser form', (path) => {
      expect(csrf.options.skip({ path })).toBe(true)
    })
  })
})
