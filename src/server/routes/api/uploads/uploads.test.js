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
  proxyUpload: vi.fn(),
  getUploadStatus: vi.fn(),
  getUploadDetails: vi.fn()
}))

import {
  initiateUpload,
  proxyUpload,
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
      payload: { redirect: '/done' }
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
      payload: { redirect: '/done', s3SubPath: 'quotes' }
    })
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.payload)).toEqual({
      uploadId: 'u1',
      uploadUrl: '/u/1'
    })
    expect(initiateUpload).toHaveBeenCalledWith({
      redirect: '/done',
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
      payload: { redirect: '/done', s3Bucket: 'evil-bucket' }
    })
    expect(res.statusCode).toBe(400)
  })

  it('rejects maxFileSize over configured ceiling', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/uploads/initiate',
      headers: auth,
      payload: { redirect: '/done', maxFileSize: 9999999999 }
    })
    expect(res.statusCode).toBe(400)
  })

  it('rejects an absolute redirect URL', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/uploads/initiate',
      headers: auth,
      payload: { redirect: 'https://evil.example/done' }
    })
    expect(res.statusCode).toBe(400)
    expect(initiateUpload).not.toHaveBeenCalled()
  })

  it('returns 502 when service returns error', async () => {
    initiateUpload.mockResolvedValue({ error: 'Unable to initiate upload' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/api/uploads/initiate',
      headers: auth,
      payload: { redirect: '/done' }
    })
    expect(res.statusCode).toBe(502)
  })
})

describe('POST /upload-and-scan/{uploadId}', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/upload-and-scan/abc12345',
      payload: 'file-bytes'
    })
    expect(res.statusCode).toBe(401)
    expect(proxyUpload).not.toHaveBeenCalled()
  })

  it('converts the upstream 302 into a JSON 200 with statusUrl', async () => {
    proxyUpload.mockResolvedValue({
      statusCode: 302,
      headers: { location: '/upload-received/abc12345' },
      stream: ''
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/upload-and-scan/abc12345',
      headers: { ...auth, 'content-type': 'application/octet-stream' },
      payload: 'file-bytes'
    })
    expect(res.statusCode).toBe(200)
    expect(res.headers.location).toBeUndefined()
    expect(JSON.parse(res.payload)).toEqual({
      uploadId: 'abc12345',
      statusUrl: '/api/uploads/abc12345'
    })
    expect(proxyUpload).toHaveBeenCalledWith(
      expect.objectContaining({ uploadId: 'abc12345' })
    )
  })

  it('relays a genuine upstream client error', async () => {
    proxyUpload.mockResolvedValue({
      statusCode: 413,
      headers: { 'content-type': 'application/json' },
      stream: JSON.stringify({ message: 'File too large' })
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/upload-and-scan/abc12345',
      headers: auth,
      payload: 'file-bytes'
    })
    expect(res.statusCode).toBe(413)
    expect(JSON.parse(res.payload)).toEqual({ message: 'File too large' })
  })

  it('returns 400 for malformed id', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/upload-and-scan/short',
      headers: auth,
      payload: 'file-bytes'
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 502 when the proxy fails', async () => {
    proxyUpload.mockResolvedValue({ error: 'Unable to proxy upload' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/upload-and-scan/abc12345',
      headers: auth,
      payload: 'file-bytes'
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
