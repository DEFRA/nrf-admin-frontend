import Joi from 'joi'

import { config } from '#/config/config.js'

const uploadIdPattern = /^[A-Za-z0-9_-]{8,128}$/
const subPathPattern = /^[A-Za-z0-9/_-]{1,200}$/

export const initiateBodySchema = Joi.object({
  redirect: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
  metadata: Joi.object()
    .pattern(Joi.string(), Joi.alternatives(Joi.string(), Joi.number(), Joi.boolean()))
    .optional(),
  maxFileSize: Joi.number()
    .integer()
    .positive()
    .max(config.get('cdpUploader.maxFileSize'))
    .optional(),
  s3SubPath: Joi.string().pattern(subPathPattern).optional()
})

export const uploadIdParamSchema = Joi.object({
  uploadId: Joi.string().pattern(uploadIdPattern).required()
})
