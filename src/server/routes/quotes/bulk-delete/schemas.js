import Joi from 'joi'

import { referencePattern } from '#/server/common/validation/reference-pattern.js'

// Bounded so a tampered payload cannot fan out into an unbounded number of
// parallel backend calls
const referenceArray = Joi.array()
  .items(Joi.string().pattern(referencePattern))
  .single()
  .max(100)
  .unique()

// Query params arrive from the quotes table form — a submission with nothing
// ticked carries no references at all, which the controller redirects back
// with a banner rather than rejecting with a 400
export const referencesQuerySchema = Joi.object({
  references: referenceArray.optional()
})

// Payload arrives from the confirmation page, whose hidden inputs always
// carry at least one reference — anything less is tampering
export const referencesPayloadSchema = Joi.object({
  references: referenceArray.min(1).required()
})
