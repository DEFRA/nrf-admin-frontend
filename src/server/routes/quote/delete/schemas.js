import Joi from 'joi'

import { referencePattern } from '#/server/common/validation/reference-pattern.js'

export const referenceParamSchema = Joi.object({
  reference: Joi.string().pattern(referencePattern).required()
})
