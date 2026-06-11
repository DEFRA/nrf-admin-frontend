import { describe, it, expect, beforeEach, vi } from 'vitest'
import Hapi from '@hapi/hapi'
import { StatusCodes } from 'http-status-codes'

vi.mock('#src/config/config.js', () => ({
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

vi.mock('../../../common/services/s3/s3.js', () => ({
  listFiles: vi.fn()
}))

import {
  initiateUpload,
  proxyUpload,
  getUploadStatus,
  getUploadDetails
} from '../../../common/services/cdp-uploader/cdp-uploader.js'
import { listFiles } from '../../../common/services/s3/s3.js'
import { bearerAuth } from '../../../common/helpers/auth/bearer-auth.js'
import { apiUploads } from './index.js'

const auth = { authorization: 'Bearer secret-token' }
const NO_AUTH_TITLE = 'returns 401 without auth'
const INITIATE_URL = '/api/uploads/initiate'
const FILES_URL = '/api/uploads/files'
const UPLOAD_SCAN_URL = '/upload-and-scan/abc12345'
const UPLOAD_DETAILS_URL = '/api/uploads/abc12345'
const FILE_PAYLOAD = 'file-bytes'

async function buildServer() {
  const server = Hapi.server()
  await server.register([bearerAuth, apiUploads])
  return server
}

describe('POST /api/uploads/initiate', () => {
  beforeEach(() => vi.clearAllMocks())

  it(NO_AUTH_TITLE, async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: INITIATE_URL,
      payload: { redirect: '/done' }
    })
    expect(res.statusCode).toBe(StatusCodes.UNAUTHORIZED)
  })

  it('returns 200 and injects server-side bucket/path', async () => {
    initiateUpload.mockResolvedValue({ uploadId: 'u1', uploadUrl: '/u/1' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: INITIATE_URL,
      headers: auth,
      payload: { redirect: '/done', s3SubPath: 'quotes' }
    })
    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual({
      uploadId: 'u1',
      uploadUrl: '/u/1'
    })
    expect(initiateUpload).toHaveBeenCalledWith({
      redirect: '/done',
      s3Bucket: 'my-bucket',
      s3Path: 'admin/quotes'
    })
  })
})

describe('POST /api/uploads/initiate - validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ignores client-supplied s3Bucket', async () => {
    initiateUpload.mockResolvedValue({ uploadId: 'u1', uploadUrl: '/u/1' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: INITIATE_URL,
      headers: auth,
      payload: { redirect: '/done', s3Bucket: 'evil-bucket' }
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
  })

  it('rejects maxFileSize over configured ceiling', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: INITIATE_URL,
      headers: auth,
      payload: { redirect: '/done', maxFileSize: 9999999999 }
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
  })

  it('rejects an absolute redirect URL', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: INITIATE_URL,
      headers: auth,
      payload: { redirect: 'https://evil.example/done' }
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(initiateUpload).not.toHaveBeenCalled()
  })

  it('returns 502 when service returns error', async () => {
    initiateUpload.mockResolvedValue({ error: 'Unable to initiate upload' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: INITIATE_URL,
      headers: auth,
      payload: { redirect: '/done' }
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_GATEWAY)
  })
})

describe('POST /upload-and-scan/{uploadId}', () => {
  beforeEach(() => vi.clearAllMocks())

  it(NO_AUTH_TITLE, async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: UPLOAD_SCAN_URL,
      payload: FILE_PAYLOAD
    })
    expect(res.statusCode).toBe(StatusCodes.UNAUTHORIZED)
    expect(proxyUpload).not.toHaveBeenCalled()
  })

  it('converts the upstream 302 into a JSON 200 with statusUrl', async () => {
    proxyUpload.mockResolvedValue({
      statusCode: StatusCodes.MOVED_TEMPORARILY,
      headers: { location: '/upload-received/abc12345' },
      stream: ''
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: UPLOAD_SCAN_URL,
      headers: { ...auth, 'content-type': 'application/octet-stream' },
      payload: FILE_PAYLOAD
    })
    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(res.headers.location).toBeUndefined()
    expect(JSON.parse(res.payload)).toEqual({
      uploadId: 'abc12345',
      statusUrl: UPLOAD_DETAILS_URL
    })
    expect(proxyUpload).toHaveBeenCalledWith(
      expect.objectContaining({ uploadId: 'abc12345' })
    )
  })

  it('relays a genuine upstream client error', async () => {
    proxyUpload.mockResolvedValue({
      statusCode: StatusCodes.REQUEST_TOO_LONG,
      headers: { 'content-type': 'application/json' },
      stream: JSON.stringify({ message: 'File too large' })
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: UPLOAD_SCAN_URL,
      headers: auth,
      payload: FILE_PAYLOAD
    })
    expect(res.statusCode).toBe(StatusCodes.REQUEST_TOO_LONG)
    expect(JSON.parse(res.payload)).toEqual({ message: 'File too large' })
  })

  it('returns 400 for malformed id', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: '/upload-and-scan/short',
      headers: auth,
      payload: FILE_PAYLOAD
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
  })

  it('returns 502 when the proxy fails', async () => {
    proxyUpload.mockResolvedValue({ error: 'Unable to proxy upload' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'POST',
      url: UPLOAD_SCAN_URL,
      headers: auth,
      payload: FILE_PAYLOAD
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_GATEWAY)
  })
})

describe('GET /api/uploads/files', () => {
  beforeEach(() => vi.clearAllMocks())

  it(NO_AUTH_TITLE, async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: FILES_URL
    })
    expect(res.statusCode).toBe(StatusCodes.UNAUTHORIZED)
    expect(listFiles).not.toHaveBeenCalled()
  })

  it('lists under the configured prefix and passes pagination through', async () => {
    listFiles.mockResolvedValue({
      files: [{ key: 'admin/test/a/b', size: 10, lastModified: '2026-01-02' }],
      isTruncated: true,
      nextToken: 'next-tok'
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: '/api/uploads/files?prefix=test&maxKeys=50&token=t0',
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toMatchObject({
      files: [{ key: 'admin/test/a/b' }],
      isTruncated: true,
      nextToken: 'next-tok'
    })
    // s3PathPrefix 'admin' + client 'test' -> 'admin/test'
    expect(listFiles).toHaveBeenCalledWith({
      prefix: 'admin/test',
      maxKeys: 50,
      token: 't0'
    })
  })

  it('defaults to the bare configured prefix when none supplied', async () => {
    listFiles.mockResolvedValue({ files: [], isTruncated: false })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: FILES_URL,
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(listFiles).toHaveBeenCalledWith({
      prefix: 'admin'
    })
  })

  it('rejects maxKeys over 1000', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: '/api/uploads/files?maxKeys=5000',
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
  })

  it('returns 502 when the service fails', async () => {
    listFiles.mockResolvedValue({ error: 'Unable to list files' })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: FILES_URL,
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_GATEWAY)
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
    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toEqual({ uploadStatus: 'ready' })
  })

  it('returns 400 for malformed id', async () => {
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: '/api/uploads/short/status',
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
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
      url: UPLOAD_DETAILS_URL,
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.OK)
    expect(JSON.parse(res.payload)).toMatchObject({ uploadStatus: 'ready' })
  })

  it('maps upstream 404 to 404', async () => {
    getUploadDetails.mockResolvedValue({
      uploadStatus: 'error',
      error: 'Unable to fetch upload details',
      statusCode: StatusCodes.NOT_FOUND
    })
    const server = await buildServer()
    const res = await server.inject({
      method: 'GET',
      url: UPLOAD_DETAILS_URL,
      headers: auth
    })
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND)
  })
})
