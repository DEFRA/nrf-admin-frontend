import Wreck from '@hapi/wreck'
import { withTraceId } from '@defra/hapi-tracing'

import { config } from '#/config/config.js'
import { createLogger } from '../../helpers/logging/logger.js'

const logger = createLogger()
const traceHeaderName = config.get('tracing.header')

export function getCdpUploaderUrl() {
  return config.get('cdpUploader.url')
}

export async function initiateUpload({
  redirect,
  s3Bucket,
  s3Path,
  metadata,
  maxFileSize
}) {
  const baseUrl = getCdpUploaderUrl()
  const url = `${baseUrl}/initiate`

  logger.info(
    `Initiating upload - url: ${url}, s3Bucket: ${s3Bucket}, s3Path: ${s3Path}, maxFileSize: ${maxFileSize}`
  )

  try {
    const body = { redirect, s3Bucket, s3Path, metadata }
    if (maxFileSize != null) {
      body.maxFileSize = maxFileSize
    }

    const { payload } = await Wreck.post(url, {
      payload: JSON.stringify(body),
      headers: withTraceId(traceHeaderName, {
        'Content-Type': 'application/json'
      }),
      json: true
    })

    const uploadUrl = payload.uploadUrl.startsWith('http')
      ? new URL(payload.uploadUrl).pathname
      : payload.uploadUrl

    return { uploadId: payload.uploadId, uploadUrl }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      error,
      `Error initiating upload - url: ${url}, baseUrl: ${baseUrl}, s3Bucket: ${s3Bucket}, s3Path: ${s3Path}, statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}`
    )
    return { error: 'Unable to initiate upload' }
  }
}

// Headers forwarded verbatim from the client's upload request to CDP Uploader.
const proxyHeaderNames = ['content-type', 'content-length', 'x-filename']

export async function proxyUpload({ uploadId, stream, headers = {} }) {
  const baseUrl = getCdpUploaderUrl()
  const url = `${baseUrl}/upload-and-scan/${uploadId}`

  logger.info(`Proxying upload - url: ${url}, uploadId: ${uploadId}`)

  const forwarded = {}
  for (const name of proxyHeaderNames) {
    if (headers[name] != null) {
      forwarded[name] = headers[name]
    }
  }

  try {
    // Wreck.request streams the body and, with no `redirects` option, does not
    // follow CDP Uploader's 302 - we relay it to the client unchanged.
    const res = await Wreck.request('POST', url, {
      payload: stream,
      headers: withTraceId(traceHeaderName, forwarded)
    })
    return { statusCode: res.statusCode, headers: res.headers, stream: res }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    logger.error(
      error,
      `Error proxying upload - url: ${url}, baseUrl: ${baseUrl}, uploadId: ${uploadId}, statusCode: ${statusCode}`
    )
    return { error: 'Unable to proxy upload' }
  }
}

export async function getUploadStatus(uploadId) {
  const baseUrl = getCdpUploaderUrl()
  const url = `${baseUrl}/status/${uploadId}`

  logger.info(`Fetching upload status - url: ${url}, uploadId: ${uploadId}`)

  try {
    const { payload } = await Wreck.get(url, {
      json: true,
      headers: withTraceId(traceHeaderName)
    })
    return { uploadStatus: payload.uploadStatus ?? 'unknown' }
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      error,
      `Error fetching upload status - url: ${url}, baseUrl: ${baseUrl}, uploadId: ${uploadId}, statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}`
    )
    return { uploadStatus: 'error', error: 'Unable to check upload status' }
  }
}

export async function getUploadDetails(uploadId) {
  const baseUrl = getCdpUploaderUrl()
  const url = `${baseUrl}/status/${uploadId}`

  logger.info(`Fetching upload details - url: ${url}, uploadId: ${uploadId}`)

  try {
    const { payload } = await Wreck.get(url, {
      json: true,
      headers: withTraceId(traceHeaderName)
    })
    return payload
  } catch (error) {
    const statusCode = error?.output?.statusCode
    const responsePayload = error?.data?.payload
    logger.error(
      error,
      `Error fetching upload details - url: ${url}, uploadId: ${uploadId}, statusCode: ${statusCode}, responsePayload: ${JSON.stringify(responsePayload)}`
    )
    return {
      uploadStatus: 'error',
      error: 'Unable to fetch upload details',
      statusCode
    }
  }
}
