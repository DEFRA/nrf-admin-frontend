import { StatusCodes } from 'http-status-codes'

import { config } from '#/config/config.js'
import {
  initiateUpload,
  proxyUpload,
  getUploadStatus,
  getUploadDetails
} from '../../../common/services/cdp-uploader/cdp-uploader.js'
import { listFiles } from '../../../common/services/s3/s3.js'

function buildS3Path(subPath) {
  const prefix = config.get('cdpUploader.s3PathPrefix') || ''
  if (!subPath) return prefix || undefined
  if (!prefix) return subPath
  return `${prefix.replace(/\/$/, '')}/${subPath.replace(/^\//, '')}`
}

export const initiateHandler = async (request, h) => {
  const { redirect, metadata, maxFileSize, s3SubPath } = request.payload
  const s3Bucket = config.get('cdpUploader.s3Bucket')
  const s3Path = buildS3Path(s3SubPath)

  const result = await initiateUpload({
    redirect,
    s3Bucket,
    s3Path,
    metadata,
    maxFileSize
  })

  if (result.error) {
    return h
      .response({ error: 'Upstream upload service unavailable' })
      .code(StatusCodes.BAD_GATEWAY)
  }
  return h.response(result).code(StatusCodes.OK)
}

export const uploadHandler = async (request, h) => {
  const { uploadId } = request.params

  // request.payload is the raw request stream (payload parsing is disabled on
  // this route) so the multipart body is forwarded to CDP Uploader untouched.
  const result = await proxyUpload({
    uploadId,
    stream: request.payload,
    headers: request.headers
  })

  if (result.error) {
    return h
      .response({ error: 'Upstream upload service unavailable' })
      .code(StatusCodes.BAD_GATEWAY)
  }

  // CDP Uploader answers a successful upload with a 302 redirect meant for a
  // browser. This is an API-only service, so collapse that into a JSON 200 and
  // point the caller at the status endpoint to poll for the scan outcome.
  if (result.statusCode < StatusCodes.BAD_REQUEST) {
    result.stream?.resume?.() // drain the unused upstream body
    return h
      .response({ uploadId, statusUrl: `/api/uploads/${uploadId}` })
      .code(StatusCodes.OK)
  }

  // Relay genuine upstream client errors (e.g. 400/413) so the caller sees them.
  const response = h.response(result.stream).code(result.statusCode)
  const contentType = result.headers?.['content-type']
  if (contentType) {
    response.type(contentType)
  }
  return response
}

export const filesHandler = async (request, h) => {
  const { prefix, maxKeys, token } = request.query

  // Scope the listing under the server-configured path prefix; any client-supplied
  // prefix narrows to a subpath within it (same rule as upload destinations).
  const result = await listFiles({
    prefix: buildS3Path(prefix),
    maxKeys,
    token
  })

  if (result.error) {
    return h
      .response({ error: 'Unable to list files' })
      .code(StatusCodes.BAD_GATEWAY)
  }
  return h.response(result).code(StatusCodes.OK)
}

export const statusHandler = async (request, h) => {
  const { uploadId } = request.params
  const result = await getUploadStatus(uploadId)
  if (result.error) {
    return h
      .response({ error: 'Upstream upload service unavailable' })
      .code(StatusCodes.BAD_GATEWAY)
  }
  return h.response(result).code(StatusCodes.OK)
}

export const detailsHandler = async (request, h) => {
  const { uploadId } = request.params
  const result = await getUploadDetails(uploadId)
  if (result.error) {
    if (result.statusCode === StatusCodes.NOT_FOUND) {
      return h
        .response({ error: 'Upload not found' })
        .code(StatusCodes.NOT_FOUND)
    }
    return h
      .response({ error: 'Upstream upload service unavailable' })
      .code(StatusCodes.BAD_GATEWAY)
  }
  return h.response(result).code(StatusCodes.OK)
}
