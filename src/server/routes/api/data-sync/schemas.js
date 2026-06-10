import Joi from 'joi'

export const triggerQuerySchema = Joi.object({
  force: Joi.boolean().default(false)
})

// Manifest forwarded verbatim to the impact-assessor: the data version plus a
// map of table name -> S3 dump key (relative to its configured prefix).
export const triggerBodySchema = Joi.object({
  data_version: Joi.string().min(1).max(255).required(),
  tables: Joi.object()
    .pattern(Joi.string().max(255), Joi.string().min(1).max(1024))
    .min(1)
    .required()
})

export const runIdParamSchema = Joi.object({
  runId: Joi.string().uuid().required()
})
