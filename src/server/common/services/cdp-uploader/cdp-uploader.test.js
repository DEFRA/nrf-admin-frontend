import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@hapi/wreck', () => ({
  default: { post: vi.fn(), get: vi.fn() }
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
