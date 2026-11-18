import { getInflationIndexHistory } from '#/server/common/services/impact-assessor-inflation-index.js'
import { inflationIndexPath } from './constants.js'
import { toHistoryTableRows } from './history-table-rows.js'

/**
 * The change history: one row per add, amendment or deletion, most recent
 * first (NRF2-1348 scenario 10). Rows outlive their index, so a deleted
 * index's changes are still listed.
 */
export const inflationIndexHistoryController = {
  async handler(_request, h) {
    const result = await getInflationIndexHistory()
    const history = result.history ?? []

    return h.view('inflation-index/history', {
      pageTitle: 'Inflation index change history',
      heading: 'Inflation index change history',
      backHref: inflationIndexPath,
      errorMessage: result.error
        ? 'The change history could not be loaded. Check the logs for details.'
        : undefined,
      tableRows: toHistoryTableRows({ history }),
      hasChanges: history.length > 0
    })
  }
}
