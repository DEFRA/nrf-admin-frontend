import { vi } from 'vitest'
import Wreck from '@hapi/wreck'
import { withTraceId } from '@defra/hapi-tracing'

import { config } from '../../../config/config.js'
import { getRequestFromBackend } from './nrf-backend.js'

const backendUrl = config.get('backend.apiUrl')
const API_KEY_CONFIG = 'backend.apiKey'

vi.mock('@hapi/wreck')

vi.mock('@defra/hapi-tracing', () => ({
  withTraceId: vi.fn(() => ({}))
}))

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn()
}))

vi.mock('../helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

describe('getRequestFromBackend', () => {
  it('calls the correct URL and returns the response', async () => {
    const mockResponse = { payload: [{ reference: 'NRL-000001' }] }
    vi.mocked(Wreck.get).mockResolvedValue(mockResponse)

    const result = await getRequestFromBackend({ endpointPath: '/quotes' })

    expect(Wreck.get).toHaveBeenCalledWith(`${backendUrl}/quotes`, {
      json: true,
      headers: {}
    })
    expect(result).toBe(mockResponse)
  })

  it('includes the tracing header when a trace id is present', async () => {
    vi.mocked(Wreck.get).mockResolvedValue({ payload: [] })
    vi.mocked(withTraceId).mockReturnValue({
      'x-cdp-request-id': 'trace-abc-123'
    })

    await getRequestFromBackend({ endpointPath: '/quotes' })

    expect(Wreck.get).toHaveBeenCalledWith(`${backendUrl}/quotes`, {
      json: true,
      headers: { 'x-cdp-request-id': 'trace-abc-123' }
    })
  })

  it('includes the x-api-key header when backend.apiKey is set', async () => {
    vi.mocked(Wreck.get).mockResolvedValue({ payload: [] })
    vi.mocked(withTraceId).mockReturnValue({})

    const original = config.get(API_KEY_CONFIG)
    config.set(API_KEY_CONFIG, 'secret-key')
    try {
      await getRequestFromBackend({ endpointPath: '/quotes' })
    } finally {
      config.set(API_KEY_CONFIG, original)
    }

    expect(Wreck.get).toHaveBeenCalledWith(`${backendUrl}/quotes`, {
      json: true,
      headers: { 'x-api-key': 'secret-key' }
    })
  })

  it('logs and rethrows when the request fails', async () => {
    const error = new Error('Network error')
    vi.mocked(Wreck.get).mockRejectedValue(error)

    await expect(
      getRequestFromBackend({ endpointPath: '/quotes' })
    ).rejects.toThrow('Network error')

    expect(mockLogger.error).toHaveBeenCalledWith(
      error,
      'Backend request failed'
    )
  })
})
