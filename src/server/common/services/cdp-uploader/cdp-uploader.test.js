import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@hapi/wreck', () => ({
  default: { post: vi.fn(), get: vi.fn(), request: vi.fn() }
}))
vi.mock('@defra/hapi-tracing', () => ({
  withTraceId: (_h, headers = {}) => headers
}))
vi.mock('#/config/config.js', async (importOriginal) => {
  const actual = await importOriginal()
  const realGet = actual.config.get.bind(actual.config)
  return {
    config: {
      get: (key) =>
        key === 'cdpUploader.url' ? 'http://localhost:7337' : realGet(key)
    }
  }
})

import Wreck from '@hapi/wreck'
import {
  initiateUpload,
  proxyUpload,
  getUploadStatus,
  getUploadDetails,
  getCdpUploaderUrl
} from './cdp-uploader.js'

describe('cdp-uploader service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCdpUploaderUrl', () => {
    it('returns the configured cdpUploader.url', () => {
      expect(getCdpUploaderUrl()).toBe('http://localhost:7337')
    })
  })

  describe('initiateUpload', () => {
    it('posts payload and returns ids', async () => {
      Wreck.post.mockResolvedValue({
        payload: { uploadId: 'u1', uploadUrl: 'http://x/upload-and-scan/u1' }
      })
      const result = await initiateUpload({
        redirect: 'https://r',
        s3Bucket: 'bucket',
        s3Path: 'p',
        metadata: { a: 1 },
        maxFileSize: 10
      })
      expect(result).toEqual({
        uploadId: 'u1',
        uploadUrl: '/upload-and-scan/u1'
      })
      const [, opts] = Wreck.post.mock.calls[0]
      expect(JSON.parse(opts.payload)).toMatchObject({
        redirect: 'https://r',
        s3Bucket: 'bucket',
        s3Path: 'p',
        maxFileSize: 10
      })
    })

    it('returns error object on Wreck failure', async () => {
      Wreck.post.mockRejectedValue(new Error('boom'))
      const result = await initiateUpload({ redirect: 'r', s3Bucket: 'b' })
      expect(result).toEqual({ error: 'Unable to initiate upload' })
    })
  })

  describe('proxyUpload', () => {
    it('streams the body and relays the upstream response', async () => {
      const upstream = {
        statusCode: 302,
        headers: { location: '/upload-received/u1' }
      }
      Wreck.request.mockResolvedValue(upstream)
      const stream = { fake: 'stream' }

      const result = await proxyUpload({
        uploadId: 'u1',
        stream,
        headers: {
          'content-type': 'multipart/form-data; boundary=x',
          'content-length': '123',
          'x-filename': 'map.geojson',
          authorization: 'Bearer secret'
        }
      })

      expect(result).toEqual({
        statusCode: 302,
        headers: { location: '/upload-received/u1' },
        stream: upstream
      })

      const [method, url, opts] = Wreck.request.mock.calls[0]
      expect(method).toBe('POST')
      expect(url).toBe('http://localhost:7337/upload-and-scan/u1')
      expect(opts.payload).toBe(stream)
      // Only the allow-listed headers are forwarded (no Authorization).
      expect(opts.headers).toEqual({
        'content-type': 'multipart/form-data; boundary=x',
        'content-length': '123',
        'x-filename': 'map.geojson'
      })
    })

    it('returns an error object on Wreck failure', async () => {
      Wreck.request.mockRejectedValue(new Error('boom'))
      const result = await proxyUpload({
        uploadId: 'u1',
        stream: {},
        headers: {}
      })
      expect(result).toEqual({ error: 'Unable to proxy upload' })
    })
  })

  describe('getUploadStatus', () => {
    it('returns uploadStatus from payload', async () => {
      Wreck.get.mockResolvedValue({ payload: { uploadStatus: 'ready' } })
      expect(await getUploadStatus('id1')).toEqual({ uploadStatus: 'ready' })
    })

    it('returns error on failure', async () => {
      Wreck.get.mockRejectedValue(new Error('nope'))
      expect(await getUploadStatus('id1')).toEqual({
        uploadStatus: 'error',
        error: 'Unable to check upload status'
      })
    })
  })

  describe('getUploadDetails', () => {
    it('returns full upstream payload', async () => {
      Wreck.get.mockResolvedValue({
        payload: { uploadStatus: 'ready', form: { file: {} } }
      })
      expect(await getUploadDetails('id1')).toEqual({
        uploadStatus: 'ready',
        form: { file: {} }
      })
    })

    it('returns error shape with statusCode on failure', async () => {
      const err = Object.assign(new Error('x'), {
        output: { statusCode: 404 }
      })
      Wreck.get.mockRejectedValue(err)
      expect(await getUploadDetails('id1')).toEqual({
        uploadStatus: 'error',
        error: 'Unable to fetch upload details',
        statusCode: 404
      })
    })
  })
})
