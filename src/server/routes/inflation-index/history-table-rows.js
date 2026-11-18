import { formatUkDateTime } from '#/server/common/helpers/uk-local-time.js'

const actionLabels = {
  added: 'Added',
  amended: 'Amended',
  deleted: 'Deleted'
}

/** @param {string} fullName @param {string} email */
const savedBy = (fullName, email) => `${fullName} (${email})`

/**
 * The change history page's table rows, most recent change first, as the
 * impact assessor returns them.
 *
 * @param {object} params
 * @param {import('#/server/common/services/impact-assessor-inflation-index.js').InflationIndexHistoryEntry[]} params.history
 * @returns {{ text: string, format?: string }[][]} Rows for the govukTable macro
 */
export const toHistoryTableRows = ({ history }) =>
  history.map((entry) => [
    { text: formatUkDateTime(entry.createdAt) },
    { text: actionLabels[entry.action] ?? entry.action },
    { text: String(entry.chargingYear), format: 'numeric' },
    { text: String(entry.cilIndex), format: 'numeric' },
    { text: entry.comment },
    { text: savedBy(entry.staffFullName, entry.staffEmail) }
  ])
