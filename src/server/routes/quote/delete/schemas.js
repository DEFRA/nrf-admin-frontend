import Joi from 'joi'

const referencePattern = /^NRL-\d{6}$/

export const referenceParamSchema = Joi.object({
  reference: Joi.string().pattern(referencePattern).required()
})
