import Joi from 'joi'

// Inflation index ids are the impact assessor's uuids
export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
})
