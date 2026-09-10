import Joi from 'joi'

import { referencePattern } from '#/server/common/validation/reference-pattern.js'

// Every ?notification=… redirect the app itself issues, plus the counts and
// reference those banners render. Anything else hitting `/` is unexpected.
const count = Joi.number().integer().min(0)

export const homeQuerySchema = Joi.object({
  notification: Joi.string(),
  count,
  reference: Joi.string().pattern(referencePattern),
  deletedCount: count,
  totalCount: count
})
