import { vi } from 'vitest'

import { loggerOptions } from './logger-options.js'

vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: () => undefined
}))

vi.mock('#/config/config.js', () => ({
  config: {
    get: (key) => {
      const values = {
        log: { enabled: true, level: 'info', format: 'ecs', redact: [] },
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        'tracing.header': 'x-cdp-request-id'
      }
      return values[key]
    }
  }
}))

describe('#loggerOptions', () => {
  describe('getChildBindings', () => {
    test('returns the request path', () => {
      const mockRequest = {
        url: { pathname: '/some/path' },
        headers: {}
      }

      expect(loggerOptions.getChildBindings(mockRequest)).toEqual({
        url: { path: '/some/path' }
      })
    })

    test('returns trace fields when request has tracing header', () => {
      const mockRequest = {
        url: { pathname: '/quotes/NRF-687396' },
        headers: { 'x-cdp-request-id': 'trace-from-header' }
      }

      expect(loggerOptions.getChildBindings(mockRequest)).toEqual({
        url: { path: '/quotes/NRF-687396' },
        trace: { id: 'trace-from-header' }
      })
    })
  })
})
