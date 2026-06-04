import { describe, it, expect, vi, beforeEach } from 'vitest'

const { send } = vi.hoisted(() => ({ send: vi.fn() }))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function MockS3Client() {
    this.send = send
  }),
  ListObjectsV2Command: vi.fn(function MockListObjectsV2Command(input) {
    this.input = input
  })
}))
vi.mock('#/config/config.js', async (importOriginal) => {
  const actual = await importOriginal()
  const realGet = actual.config.get.bind(actual.config)
  return {
    config: {
      get: (key) =>
        key === 'cdpUploader.s3Bucket' ? 'data_backups' : realGet(key)
    }
  }
})

import { ListObjectsV2Command } from '@aws-sdk/client-s3'
import { listFiles } from './s3.js'

describe('s3 service - listFiles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps objects and passes through pagination', async () => {
    const when = new Date('2026-01-02T03:04:05Z')
    send.mockResolvedValue({
      Contents: [
        { Key: 'admin/test/a/b', Size: 10, LastModified: when },
        { Key: 'admin/test/c/d', Size: 20, LastModified: when }
      ],
      IsTruncated: true,
      NextContinuationToken: 'next-tok'
    })

    const result = await listFiles({
      prefix: 'admin/test',
      maxKeys: 50,
      token: 't0'
    })

    expect(result).toEqual({
      files: [
        { key: 'admin/test/a/b', size: 10, lastModified: when },
        { key: 'admin/test/c/d', size: 20, lastModified: when }
      ],
      isTruncated: true,
      nextToken: 'next-tok'
    })

    expect(ListObjectsV2Command).toHaveBeenCalledWith({
      Bucket: 'data_backups',
      Prefix: 'admin/test',
      MaxKeys: 50,
      ContinuationToken: 't0'
    })
  })

  it('defaults to an empty list and isTruncated false', async () => {
    send.mockResolvedValue({})
    const result = await listFiles({ prefix: 'admin' })
    expect(result).toEqual({
      files: [],
      isTruncated: false
    })
  })

  it('returns an error object on failure', async () => {
    send.mockRejectedValue(new Error('boom'))
    expect(await listFiles({ prefix: 'admin' })).toEqual({
      error: 'Unable to list files'
    })
  })
})
