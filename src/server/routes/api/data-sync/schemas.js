import Joi from 'joi'

export const triggerQuerySchema = Joi.object({
  force: Joi.boolean().default(false)
})

const MAX_NAME_LENGTH = 255
const MAX_S3_KEY_LENGTH = 1024

const s3Key = Joi.string().min(1).max(MAX_S3_KEY_LENGTH)

// Manifest forwarded verbatim to the impact-assessor: a map of table name ->
// its S3 dump key (relative to the configured prefix) plus the version to
// record. Each table carries its own version — a subset of the allow-list is
// valid, so there is no single global data version.
//
// `key` is a single object key, or — for a dump split by `split -b` — the
// ordered list of its part keys. List order is concatenation order; the
// impact-assessor owns the contiguity check, so this only shapes the payload.
export const triggerBodySchema = Joi.object({
  tables: Joi.object()
    .pattern(
      Joi.string().max(MAX_NAME_LENGTH),
      Joi.object({
        key: Joi.alternatives()
          .try(s3Key, Joi.array().items(s3Key).min(1))
          .required(),
        version: Joi.string().min(1).max(MAX_NAME_LENGTH).required()
      })
    )
    .min(1)
    .required()
})

// Optional body for a rollback: an explicit list of tables, or nothing at all
// to let the impact-assessor default to the tables of the most recent load.
export const rollbackBodySchema = Joi.object({
  tables: Joi.array().items(Joi.string().min(1).max(MAX_NAME_LENGTH)).min(1)
})
  .allow(null)
  .default({})

export const runIdParamSchema = Joi.object({
  runId: Joi.string().uuid().required()
})
