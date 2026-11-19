import { formatUkDateTime } from '#/server/common/helpers/uk-local-time.js'

/** @param {string} fullName @param {string} email */
const savedBy = (fullName, email) => `${fullName} (${email})`

/**
 * The additions history page's table rows, most recent addition first, as
 * the impact assessor returns them.
 *
 * @param {object} params
 * @param {import('#/server/common/services/impact-assessor-inflation-index.js').InflationIndexHistoryEntry[]} params.history
 * @returns {{ text: string, format?: string }[][]} Rows for the govukTable macro
 */
export const toHistoryTableRows = ({ history }) =>
  history.map((entry) => [
    { text: formatUkDateTime(entry.createdAt) },
    { text: String(entry.chargingYear), format: 'numeric' },
    { text: String(entry.cilIndex), format: 'numeric' },
    { text: entry.comment },
    { text: savedBy(entry.staffFullName, entry.staffEmail) }
  ])
