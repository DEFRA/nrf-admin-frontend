import { describe, it, expect, beforeEach, vi } from 'vitest'
import Hapi from '@hapi/hapi'

vi.mock('#/config/config.js', () => ({
  config: {
    get: (k) => {
      const map = {
        'api.bearerToken': 'secret-token',
        'cdpUploader.s3Bucket': 'my-bucket',
        'cdpUploader.s3PathPrefix': 'admin',
        'cdpUploader.maxFileSize': 1000000
      }
      return map[k]
    }
  }
}))

vi.mock('../../../common/services/cdp-uploader/cdp-uploader.js', () => ({
  initiateUpload: vi.fn(),
  getUploadStatus: vi.fn(),
  getUploadDetails: vi.fn()
}))

import {
  initiateUpload,
  getUploadStatus,
  getUploadDetails
} from '../../../common/services/cdp-uploader/cdp-uploader.js'
import { bearerAuth } from '../../../common/helpers/auth/bearer-auth.js'
import { apiUploads } from './index.js'

const auth = { authorization: 'Bearer secret-token' }

async function buildServer() {
  const server = Hapi.server()
  await server.register([bearerAuth, apiUploads])
  return server
}

describe('POST /api/uploads/initiate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/uploads/initiate',
      payload: { redirect: 'https://x' }
    })
    expect(res.statusCode).toBe(401)
  })

  it('returns 200 and injects server-side bucket/path', async () => {
    initiateUpload.mockResolvedValue({ uploadId: 'u1', uploadUrl: '/u/1' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/uploads/initiate',
      headers: auth,
      payload: { redirect: 'https://x', s3SubPath: 'quotes' }
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      uploadId: 'u1',
      uploadUrl: '/u/1'
    })
    expect(initiateUpload).toHaveBeenCalledWith({
      redirect: 'https://x',
      s3Bucket: 'my-bucket',
      s3Path: 'admin/quotes',
      metadata: undefined,
      maxFileSize: undefined
    })
  })

  it('ignores client-supplied s3Bucket', async () => {
    initiateUpload.mockResolvedValue({ uploadId: 'u1', uploadUrl: '/u/1' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/uploads/initiate',
      headers: auth,
      payload: { redirect: 'https://x', s3Bucket: 'evil-bucket' }
    })
    expect(res.statusCode).toBe(400)
  })

  it('rejects maxFileSize over configured ceiling', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/uploads/initiate',
      headers: auth,
      payload: { redirect: 'https://x', maxFileSize: 9999999999 }
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 502 when service returns error', async () => {
    initiateUpload.mockResolvedValue({ error: 'Unable to initiate upload' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/uploads/initiate',
      headers: auth,
      payload: { redirect: 'https://x' }
    })
    expect(res.statusCode).toBe(502)
  })
})

describe('GET /api/uploads/{uploadId}/status', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with status', async () => {
    getUploadStatus.mockResolvedValue({ uploadStatus: 'ready' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: '/api/uploads/abc12345/status',
      headers: auth
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({ uploadStatus: 'ready' })
  })

  it('returns 400 for malformed id', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: '/api/uploads/short/status',
      headers: auth
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('GET /api/uploads/{uploadId}', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with full details', async () => {
    getUploadDetails.mockResolvedValue({
      uploadStatus: 'ready',
      form: { file: {} }
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: '/api/uploads/abc12345',
      headers: auth
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toMatchObject({ uploadStatus: 'ready' })
  })

  it('maps upstream 404 to 404', async () => {
    getUploadDetails.mockResolvedValue({
      uploadStatus: 'error',
      error: 'Unable to fetch upload details',
      statusCode: 404
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: '/api/uploads/abc12345',
      headers: auth
    })
    expect(res.statusCode).toBe(404)
  })
})
