import Joi from 'joi'

/**
 * Free text from a form, trimmed, with angle brackets removed so markup such as
 * a script tag cannot be stored. Two plain character replacements, with no
 * quantifier backtracking, avoid ReDoS on malformed input.
 *
 * @param {number} max Longest input accepted before sanitising
 * @returns {import('joi').StringSchema}
 */
export const sanitizedText = (max) =>
  Joi.string()
    .trim()
    .max(max)
    .allow('')
    .default('')
    .custom((value) => value.replaceAll('<', '').replaceAll('>', '').trim())
