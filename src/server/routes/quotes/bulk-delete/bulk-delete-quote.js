import { deleteQuote } from '../../quote/delete/delete-quote.js'
import { getQuotes } from '../../home/get-quotes.js'

/**
 * Deletes each quote via the backend delete endpoint. Eligibility is this
 * app's check now the backend no longer gates the endpoint, so ineligible or
 * unknown references are filtered out before anything is sent — and when the
 * quotes cannot be fetched, nothing is deleted at all (fail safe). Failures
 * are counted rather than thrown so one bad quote does not block the rest.
 *
 * @param {string[]} references - NRL references, e.g. ['NRL-000001']
 * @returns {Promise<{ deleted: number, failed: number, notEligible: number }>}
 *   notEligible counts the references refused by the local eligibility check
 *   (or unknown to the backend), as distinct from server faults
 */
export async function deleteQuotes(references) {
  const { quotes, errorMessage } = await getQuotes()
  if (errorMessage) {
    return { deleted: 0, failed: references.length, notEligible: 0 }
  }

  const eligibleReferences = new Set(
    (quotes ?? [])
      .filter((quote) => quote.deleteEligible)
      .map((quote) => quote.reference)
  )
  const deletable = references.filter((reference) =>
    eligibleReferences.has(reference)
  )

  const outcomes = await Promise.allSettled(
    deletable.map((reference) => deleteQuote(reference))
  )
  // deleteQuote catches its own backend errors, but allSettled keeps one
  // unexpected rejection from cutting the remaining deletes short — a
  // rejected outcome just counts as a failed quote
  const results = outcomes.map((outcome) =>
    outcome.status === 'fulfilled' ? outcome.value : { deleted: false }
  )

  const deleted = results.filter((result) => result.deleted).length
  const notEligible = references.length - deletable.length
  return { deleted, failed: references.length - deleted, notEligible }
}
