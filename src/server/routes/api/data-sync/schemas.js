import Joi from 'joi'

export const triggerQuerySchema = Joi.object({
  force: Joi.boolean().default(false)
})

export const runIdParamSchema = Joi.object({
  runId: Joi.string().uuid().required()
})
