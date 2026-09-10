import { statusCodes } from '#/server/common/constants/status-codes.js'
import { deleteQuote } from '../../quote/delete/delete-quote.js'

/**
 * Deletes each quote via the backend delete endpoint. The backend enforces
 * eligibility per quote; failures (403 or otherwise) are counted rather than
 * thrown so one bad quote does not block the rest.
 *
 * @param {string[]} references - NRL references, e.g. ['NRL-000001']
 * @returns {Promise<{ deleted: number, failed: number, notEligible: number }>}
 *   notEligible counts the failures that were 403s — the backend's
 *   eligibility check refusing the quote, as distinct from server faults
 */
export async function deleteQuotes(references) {
  const outcomes = await Promise.allSettled(
    references.map((reference) => deleteQuote(reference))
  )
  // deleteQuote catches its own backend errors, but allSettled keeps one
  // unexpected rejection from cutting the remaining deletes short — a
  // rejected outcome just counts as a failed quote
  const results = outcomes.map((outcome) =>
    outcome.status === 'fulfilled' ? outcome.value : { deleted: false }
  )

  const deleted = results.filter((result) => result.deleted).length
  const notEligible = results.filter(
    (result) => result.statusCode === statusCodes.forbidden
  ).length
  return { deleted, failed: references.length - deleted, notEligible }
}
