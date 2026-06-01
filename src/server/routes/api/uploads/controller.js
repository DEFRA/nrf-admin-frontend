import { config } from '#/config/config.js'
import {
  initiateUpload,
  getUploadStatus,
  getUploadDetails
} from '../../../common/services/cdp-uploader/cdp-uploader.js'

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
      .code(502)
  }
  return h.response(result).code(200)
}

export const statusHandler = async (request, h) => {
  const { uploadId } = request.params
  const result = await getUploadStatus(uploadId)
  if (result.error) {
    return h
      .response({ error: 'Upstream upload service unavailable' })
      .code(502)
  }
  return h.response(result).code(200)
}

export const detailsHandler = async (request, h) => {
  const { uploadId } = request.params
  const result = await getUploadDetails(uploadId)
  if (result.error) {
    if (result.statusCode === 404) {
      return h.response({ error: 'Upload not found' }).code(404)
    }
    return h
      .response({ error: 'Upstream upload service unavailable' })
      .code(502)
  }
  return h.response(result).code(200)
}
