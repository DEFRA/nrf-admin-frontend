import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

import { config } from '#/config/config.js'
import { createLogger } from '../../helpers/logging/logger.js'

const logger = createLogger()

let client

export function getS3Client() {
  if (!client) {
    const endpoint = config.get('aws.s3Endpoint')
    client = new S3Client({
      region: config.get('aws.region'),
      // Local emulators (floci/localstack) need a custom endpoint and path-style
      // addressing; a configured endpoint also overrides any AWS_ENDPOINT_URL env.
      ...(endpoint ? { endpoint, forcePathStyle: true } : {})
    })
  }
  return client
}

export async function listFiles({ prefix, maxKeys, token } = {}) {
  const bucket = config.get('cdpUploader.s3Bucket')

  logger.info(`Listing S3 files - bucket: ${bucket}, prefix: ${prefix}`)

  try {
    const out = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        MaxKeys: maxKeys,
        ContinuationToken: token
      })
    )

    const files = (out.Contents ?? []).map((o) => ({
      key: o.Key,
      size: o.Size,
      lastModified: o.LastModified
    }))

    return {
      files,
      isTruncated: out.IsTruncated ?? false,
      nextToken: out.NextContinuationToken
    }
  } catch (error) {
    logger.error(
      error,
      `Error listing S3 files - bucket: ${bucket}, prefix: ${prefix}`
    )
    return { error: 'Unable to list files' }
  }
}
