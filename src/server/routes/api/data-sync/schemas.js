import Joi from 'joi'

export const triggerQuerySchema = Joi.object({
  force: Joi.boolean().default(false)
})

const MAX_NAME_LENGTH = 255
const MAX_S3_KEY_LENGTH = 1024

// Manifest forwarded verbatim to the impact-assessor: the data version plus a
// map of table name -> S3 dump key (relative to its configured prefix).
export const triggerBodySchema = Joi.object({
  data_version: Joi.string().min(1).max(MAX_NAME_LENGTH).required(),
  tables: Joi.object()
    .pattern(
      Joi.string().max(MAX_NAME_LENGTH),
      Joi.string().min(1).max(MAX_S3_KEY_LENGTH)
    )
    .min(1)
    .required()
})

export const runIdParamSchema = Joi.object({
  runId: Joi.string().uuid().required()
})
